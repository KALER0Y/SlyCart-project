import os
import logging

import uuid
from typing import List

from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from ninja import Form, Router, File
from ninja.errors import HttpError
from ninja.pagination import paginate
from ninja.files import UploadedFile
# Импортируем нужные классы из библиотеки ninja_jwt
# Класс выше(AccessToken) содержит в себе всю сложную математику криптографии для расшифроки и проверки секретного ключа
from ninja.responses import Response
from ninja_jwt.tokens import RefreshToken, AccessToken
# Класс TokenError будет выскакивать если ключ подделан или просрочен
from ninja_jwt.exceptions import TokenError
# Этот класс работает с безопасностью кук. Автоматически парсит заголовки браузера и ищет там куки
from ninja.security import APIKeyCookie, APIKeyHeader
from django.middleware.csrf import get_token


from .exceptions import NegativePriceError, SignatureError
from .utils.set_cookie import set_auth_cookie
from .utils.initdata import verify_telegram_initdata
from .models import OwnerProfile, Product, Shop
from .services import (
    create_user, 
    create_shop,
    create_product,
    UserAlreadyExistsError, 
    PhoneNumberAlreadyTakenError, 
    BrandAlreadyTakenError, 
    EmptyPhoneNumberError, 
    InvalidRoleError
    )
from .schemas import (
    TelegramUserOut, 
    TelegramUserIn,
    StoreOutSchema,
    StoreCreateSchema,
    ProductIn,
    ProductOut,
    ProductPatch
    )
from .models import TelegramUser

logger = logging.getLogger(__name__)

core_router = Router()

class InitDataJWTAuth(APIKeyHeader):
    param_name = "X-TG-Init-Data"

    def authenticate(self, request, key):
        from .models import TelegramUser
        # 1) В key у нас лежит наша query-строка. Вызываем функцию валидации.
        try:
            raw_data = verify_telegram_initdata(key)

            # 2) Теперь у нас есть словарь со значениями. Достанем от туда юзер айди
            user_id = raw_data.get("id")

            # 3) Ищем пользователя по этому ключу
            
            user = TelegramUser.objects.get(user_id=user_id)

            return user


        except (TelegramUser.DoesNotExist, SignatureError):
            return None

# Дорабатываем класс Cookie под себя с помощью наследования.
# APIKeyCookie как робот - может делать 90 процентов работы, но он не знает что именно мне надо
class CookieJWTAuth(APIKeyCookie):
    param_name = "access"

    def authenticate(self, request, key):
        # key - то что нашел "робот" в нашей куки. Это наш access токен в виде строки
        from .models import TelegramUser
        if not key:
            return None
        try:
            # 1. Передайть токен (переменную key) в класс AccessToken, чтобы расшифровать его.
            # Назвать результат, например, access_token.
            access_token = AccessToken(token=key)

            # 2. Достать ID пользователя из расшифрованного токена.
            user_id = access_token["user_id"]

            # 3. Найти в базе данных пользователя TelegramUser по его user_id
            user = TelegramUser.objects.get(id=user_id)

            # 4. Вернуть найденного пользователя (return user).
            return user
        
        except (TokenError, TelegramUser.DoesNotExist, KeyError):
            return None

        except Exception as e:
            import traceback
            print("❌ --- ОШИБКА ВНУТРИ AUTHENTICATE --- ❌")
            traceback.print_exc() # Распечатает подробную трассировку ошибки в терминал
            return None
        
class RefreshCookieJWTAuth(APIKeyCookie):
    param_name = "refresh"

    def authenticate(self, request, key):
        from .models import TelegramUser
        if not key:
            return None
        try:
            # 1) Достаем токен, расшифровываем
            refresh_token = RefreshToken(token=key)

            # 2) Достаем юзера
            user_id = refresh_token["user_id"]

            # 3) Ищем его в базе данных
            user = TelegramUser.objects.get(id=user_id)

            # 4) Возвращаем
            return user
        
        except (TelegramUser.DoesNotExist, TokenError, KeyError):
            return None


        
cookie_auth = CookieJWTAuth()
refresh_auth = RefreshCookieJWTAuth()
initdata_auth = InitDataJWTAuth()


DEBUG = os.getenv("DEBUG", "False") == "True" 
# Эндпоинты (Endpoints) — это, по сути, «адреса», 
# по которым твой фронтенд (или Telegram-бот) будет обращаться к твоему бэкенду за данными.

@core_router.post("/register", response={201: TelegramUserOut}, tags=["POST"]) # Что то похожее на эндпоинт
def create_user_endpoint(request, data: TelegramUserIn, response: HttpResponse): # Что будет принимать функция
    try:
        valid_user = verify_telegram_initdata(data.init_data)

        user = create_user(
            telegram_id=valid_user.get('id'),
            role=data.role
        )

        
    except (UserAlreadyExistsError, PhoneNumberAlreadyTakenError, BrandAlreadyTakenError, SignatureError) as e:
        raise HttpError(400, str(e))
    except (EmptyPhoneNumberError, InvalidRoleError) as e:
        raise HttpError(422, str(e))
        
    refresh = RefreshToken.for_user(user)
    csrf_token = get_token(request) # Лучше перевести в string
    # Пример: response.set_cookie(key="csrf_token", value=csrf_token, httponly=False)
    # Сервер кладет в куки случайную строку. 
    # Важно: httponly=False. 
    # Это значит, что твой React-код может прочитать эту куку. 
    # Левый сайт прочитать куки другого домена не может из-за политики безопасности браузеров (SOP).

    access = refresh.access_token
    access["role"] = user.role
    # Эта функция будет ложить куки в HttpResponse автоматически
    set_auth_cookie(
        response=response, 
        access_token=str(access), # Превращаем в строку здесь
        refresh_token=str(refresh),
        csrf_token=csrf_token, 
        debug_status=DEBUG,
        )

    return user
    

@core_router.post('/shop', 
                  response=StoreOutSchema, 
                  auth=[CookieJWTAuth(), RefreshCookieJWTAuth(), InitDataJWTAuth()], 
                  tags=["POST"])
def create_shop_endpoint(request, 
                         data: StoreCreateSchema = Form(...),
                         logo_file: UploadedFile = File(...)):

    # Достаем залогиненного юзера из реквеста (который распарсил JWT)
    user = request.auth  

    # Ищем профиль владельца ИМЕННО этого залогиненного юзера
    owner = get_object_or_404(
        OwnerProfile,
        owner=user
        )

    shop = create_shop(
        user=owner,
        name=data.name,
        description=data.description,
        logo_file=logo_file
    )

    return shop

@core_router.post("/shops/{shop_id}/product", 
                  auth=[CookieJWTAuth(), RefreshCookieJWTAuth(), InitDataJWTAuth()],
                  response=ProductOut, 
                  tags=["POST"])
def create_product_endpoint(request,
                            shop_id: uuid.UUID,
                            data: ProductIn = Form(...), 
                            image: UploadedFile = File(...)):

    shop = get_object_or_404(Shop, id=shop_id, owner__owner__user_id=request.auth.user_id)

    product = create_product(
        shop=shop,
        title=data.title,
        description=data.description,
        price=data.price,
        image=image,
        is_active=data.is_active,
        stock=data.stock
    )

    return product

@core_router.get("/shops/{shop_id}",
                 auth=[CookieJWTAuth(), RefreshCookieJWTAuth(), InitDataJWTAuth()],
                 response=StoreOutSchema,
                 )
def define_owner_endpoint(request, shop_id: uuid.UUID):

    # 1) Ищем магазин
    shop = get_object_or_404(Shop, id=shop_id)
    # 2) Проверяем является ли аутентифицированный пользователь владельцем и записываем в ОЗУ
    shop.is_owner = (shop.owner.owner == request.auth)
    # 3) Возвращаем магазин
    return shop



@core_router.get("/my-shops", response=List[StoreOutSchema],
                 auth=[CookieJWTAuth(), RefreshCookieJWTAuth(), InitDataJWTAuth()],
                 tags=["GET"])
def list_my_shops_endpoint(request):

    owner = get_object_or_404(OwnerProfile, owner=request.auth)

    shops = Shop.objects.filter(owner=owner)

    for shop in shops:
        shop.is_owner = True

    return shops

@core_router.get('/shops/{shop_id}/products', response=List[ProductOut], tags=["GET"])
def product_list_endpoint(request, shop_id: uuid.UUID):
    # ninja легче работать напрямую через QuerySet, чем через переменные. Переменные могут вызывать ошибки
    return Product.objects.filter(shop_id=shop_id)
    # removed .select_related('shop') as ProductOut now uses shop_id directly, avoiding extra JOIN/query


@core_router.patch("/product/{product_id}", response=ProductOut, tags=["PATCH"])
def edit_products_endpoint(request, product_id: int , data: ProductPatch):

    product = get_object_or_404(
            Product, 
            id=product_id, 
            shop__owner__owner__user_id=data.user_id
        )

    update_data = data.dict(exclude_unset=True)

    update_data.pop("user_id", None)

    for field, value in update_data.items():
        if field == "price" and value < 0:
            raise NegativePriceError("Цена не может быть отрицательной!")
        setattr(product, field, value)
    

    product.save()

    return product

@core_router.get("/all-shops", response=List[StoreOutSchema], tags=["GET"])
def list_shops_endpoint(request):
    return Shop.objects.all()

@core_router.get("/products/{shop_id}", response=List[ProductOut], tags=["GET"])
@paginate
def list_products_endpoint(request, shop_id: uuid.UUID):
    return Product.objects.filter(shop_id=shop_id)

# @core_router.get("/products/{shop_name}", tags=["GET"])

        

@core_router.delete("/product/{product_id}", response={204: None}, tags=["DELETE"])
def delete_product_endpoint(request, product_id: int, owner_id: int):
    
    product = get_object_or_404(
        Product,
        id=product_id,
        shop__owner__owner__user_id=owner_id
    )

    product.delete()

    return 204, None


@core_router.get("/me", auth=cookie_auth, tags=["Auth"])
def jwt_token_auth(request):
        
    return {
        "authenticated": True,
        "role": request.auth.role, # auth вместо user, потому что в user лежит AnonymousUser без данных
        "user_id": request.auth.user_id,
    }

@core_router.get('/refresh', auth=refresh_auth, tags=["Auth"])
def refresh_token_auth(request):
    
    # 1) Записать нового пользователя
    user = request.auth

    # 2) Найти старый токены и ревоукнуть
    old_refresh = RefreshToken(token=request.COOKIES.get("refresh"))
    old_refresh.blacklist()

    # 3) Создать новые токены
    new_refresh = RefreshToken.for_user(user)
    new_access = new_refresh.access_token

    # 4) Записать новые токены
    data = {
        "authenticated": True,
        "role": request.auth.role, 
        "user_id": request.auth.user_id,
    }

    response = Response(data)

    csrf_token = request.COOKIES.get("csrf_token")

    new_access["role"] = user.role
    # Эта функция будет ложить куки в HttpResponse автоматически
    set_auth_cookie(
        response=response, 
        access_token=str(new_access), # Превращаем в строку здесь
        refresh_token=str(new_refresh),
        csrf_token=csrf_token if csrf_token else get_token(request), 
        debug_status=DEBUG,
        )
    
    return response

@core_router.get("/login", auth=initdata_auth, tags=["Auth"])
def initdata_auth(request):
    
    data = {
        "authenticated": True,
        "role": request.auth.role, # auth вместо user, потому что в user лежит AnonymousUser без данных
        "user_id": request.auth.user_id,
    }

    user = request.auth
    refresh = RefreshToken.for_user(user)
    csrf_token = get_token(request) # Лучше перевести в string

    response = Response(data)

    access = refresh.access_token
    access["role"] = user.role
    # Эта функция будет ложить куки в HttpResponse автоматически
    set_auth_cookie(
        response=response, 
        access_token=str(access), # Превращаем в строку здесь
        refresh_token=str(refresh),
        csrf_token=csrf_token, 
        debug_status=DEBUG,
        )
    
    return response




  
# Когда в Django Ninja срабатывает встроенная магия login(request, user), 
# бэкенд намертво связывает сессию с конкретным объектом твоей модели TelegramUser.
# При каждом следующем запросе (например, когда Next.js стучится на эндпоинт /me), 
# под капотом Django происходит следующий сквозной процесс:Встроенный слой (Middleware) 
# перехватывает запрос и читает куку sessionid. 
# Он идет в базу данных PostgreSQL, находит там сессию и достает из нее id привязанного пользователя.
# Django делает запрос в базу и автоматически создает готовый объект твоей модели TelegramUser.
# Самое главное: Джанго берет этот живой объект пользователя и прикрепляет его прямо к текущему запросу в переменную request.user.

# Но у меня свои собственные access и refresh токены, а sessionid просто не существует!
# Поэтому нужно делать все иначе:
# 1. Вместо sessionid бэкенд должен руками залезть в прилетевшие куки и достать куку 'access'.
# 2. Так как в базе данных PostgreSQL этой сессии нет, бэкенд должен взять этот 'access' токен и расшифровать его своим секретным ключом.
# 3. Из расшифрованного токена бэкенд достает id пользователя, идет в базу, находит этого юзера и подставляет его в request.user.
