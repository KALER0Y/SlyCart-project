from datetime import datetime
import json
import uuid
from django.http import JsonResponse 
import os

from ninja_extra import NinjaExtraAPI, api_controller, http_post
from core.api import core_router
from core.utils import set_auth_cookie

# Этот класс работает с безопасностью кук. Автоматически парсит заголовки браузера и ищет там куки
from ninja.security import APIKeyCookie 

# Импортируем нужные классы из библиотеки ninja_jwt
from ninja_jwt.tokens import AccessToken
# Класс выше(AccessToken) содержит в себе всю сложную математику криптографии для расшифроки и проверки секретного ключа
from ninja_jwt.exceptions import TokenError
# Класс TokenError будет выскакивать если ключ подделан или просрочен

from core.models import TelegramUser 
from ninja.renderers import JSONRenderer
from core.exceptions import UserAlreadyExistsError, PhoneNumberAlreadyTakenError
from ninja.responses import NinjaJSONEncoder
from ninja_jwt.schema import TokenObtainPairOutputSchema
from core.schemas import MyTokenObtainPairSchema

class UnicodeJSONRenderer(JSONRenderer):
    def render(self, request, data, *, response_status):
        return json.dumps(
            data, 
            cls=NinjaJSONEncoder, # добавили поддержку дат и чисел, так как базовый json это не поддерживает
            ensure_ascii=False
        ).encode("utf-8")

DEBUG = os.getenv("DEBUG", "False") == "True" 
# Если нет DEBUG, то значение False по умолчанию

api = NinjaExtraAPI(renderer=UnicodeJSONRenderer())

@api.exception_handler(UserAlreadyExistsError)
def user_already_exists_handler(request, exc):

    return api.create_response(
        request=request,
        data={
            "detail": str(exc),
            "timestamp": datetime.now(),      # Сработает благодаря NinjaJSONEncoder
            "error_id": uuid.uuid4(),         # Сработает благодаря NinjaJSONEncoder
            "method": request.method,
            "is_authenticated": request.user.is_authenticated, 
            "user_status": "Guest" if request.user.is_anonymous else "Member",
            "path": request.path
            },
        status=400
    )

@api.exception_handler(PhoneNumberAlreadyTakenError)
def user_already_exists_handler(request, exc):

    return api.create_response(
        request=request,
        data={
            "detail": str(exc),
            "timestamp": datetime.now(),      # Сработает благодаря NinjaJSONEncoder
            "error_id": uuid.uuid4(),         # Сработает благодаря NinjaJSONEncoder
            "method": request.method,
            "is_authenticated": request.user.is_authenticated, 
            "user_status": "Guest" if request.user.is_anonymous else "Member",
            "path": request.path
            },
        status=400
    )

# Дорабатываем класс Cookie под себя с помощью наследования.
# APIKeyCookie как робот - может делать 90 процентов работы, но он не знает что именно мне надо
class CookieJWTAuth(APIKeyCookie):
    param_name = "access" 

    def authenticate(self, request, key):
        # key - то что нашел "робот" в нашей куки. Это наш access токен в виде строки
        try:
            # 1. Передайте токен (переменную key) в класс AccessToken, чтобы расшифровать его.
            # Назовите результат, например, access_token.
            access_token = AccessToken(token=key)
            
            # 2. Достаньте ID пользователя из расшифрованного токена.
            user_id = access_token["user_id"]

            # 3. Найдите в базе данных пользователя TelegramUser по его user_id
            user = TelegramUser.objects.get(user_id=user_id)
            
            # 4. Верните найденного пользователя (return user).
            return user
        except (TokenError, TelegramUser.DoesNotExist):
            # Если токен невалидный или юзера нет в базе — возвращаем None
            return None
        

@api_controller('/auth', tags=['Auth']) # Обязательно через декоратор!
class MyTokenController:
    @http_post("/pair", response=TokenObtainPairOutputSchema)
    def obtain_token(self, user_token: MyTokenObtainPairSchema):
        # Метод to_response_schema теперь содержит всю логику поиска и генерации
        auth_data = user_token.to_response_schema() # Получаем токен

        
        csrf_token = str(uuid.uuid4()) # Лучше перевести в string
        # Пример: response.set_cookie(key="csrf_token", value=csrf_token, httponly=False)
        # Сервер кладет в куки случайную строку. 
        # Важно: httponly=False. 
        # Это значит, что твой React-код может прочитать эту куку. 
        # Левый сайт (сайт с котиками) прочитать куки другого домена не может из-за политики безопасности браузеров (SOP).

        response = JsonResponse({
            "user_id": auth_data["user_id"],
            "detail": "Successfully authenticated"
        })


        return set_auth_cookie(
            response=response, 
            access_token=auth_data["access"], 
            refresh_token=auth_data["refresh"], 
            csrf_token=csrf_token, 
            debug_status=DEBUG
            )


api.add_router("/core/", core_router)
api.register_controllers(MyTokenController)

# TODO: MiddleWare для сверки csrf токена