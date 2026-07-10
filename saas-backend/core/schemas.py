from decimal import Decimal
from typing import Optional
from pydantic import PositiveInt
import uuid
from ninja import Field, Schema, ModelSchema
from ninja_jwt.tokens import RefreshToken
from django.db.models import Q
from ninja.errors import HttpError
from .models import TelegramUser, Shop, Product
from enum import Enum

class Roles(str, Enum):
    customer = "customer"
    owner = "owner" 

class TelegramUserIn(Schema): # Что мы будем вносить
    init_data: str
    role: Roles


class TelegramUserOut(ModelSchema): # Что мы будет отдавать в front(modelSchema лучше использовать для Out)
    class Meta:
        model = TelegramUser
        fields = ['user_id', 'role']


class ShopIn(Schema):
    owner: int
    shop_name: str
    shop_link: str = None


class ShopOut(ModelSchema):
    # ModelSchema сделает все сама
    owner_id: int  # Это "дополнительное" поле для JSON

    class Meta:
        model = Shop
        fields = ['id', 'shop_name', 'shop_link'] # Здесь ТОЛЬКО реальные колонки из таблицы Shop

    @staticmethod # "Добытчик" сам все найдет и напишет
    def resolve_owner_id(obj):
        return obj.owner.owner.user_id


class ProductIn(Schema):
    shop: uuid.UUID
    user_id: int
    title: str
    description: str
    price: Decimal = Field(..., max_digits=10, decimal_places=2) # ...(элипс) означает что поле обязательное. 
    # Информацию обязательно должен прислать бекэнд или пользователь 
    stock: PositiveInt
    is_active: bool = True


class ProductOut(ModelSchema):

    price: Decimal = Field(..., max_digits=12, decimal_places=2, json_schema_extra={"example": "0.00"})

    shop_id: uuid.UUID = Field(..., alias="shop_id")
    # Always prefer `alias="field_id"` over `alias="field.id"` in schemas when only the ID is needed.

    class Meta:
        model = Product
        fields = ["id", "title", "description", "price", "stock", "is_active"]

class ProductPatch(Schema):
    user_id: int
    title: Optional[str]
    description: Optional[str]
    price: Optional[Decimal] 
    stock: Optional[PositiveInt]
    is_active: Optional[bool]

class MyTokenObtainPairSchema(Schema):

    user_id: int
    phone_number: str

    def to_response_schema(self):
        # Используем Q-объекты для реализации логики "ИЛИ" (OR) в SQL-запросе.
        # Это позволяет одним запросом проверить наличие номера телефона 
        # сразу в двух разных таблицах профилей (Customer и Owner), 
        # связанных с пользователем через ForeignKey.
        user = TelegramUser.objects.select_related("customer_profile", "owner_profile").filter(
            Q(user_id=self.user_id) & 
            (Q(customer_profile__phone=self.phone_number) | Q(owner_profile__phone=self.phone_number))
        ).first() # Самое первое что нашли

        # 2. Если пользователь не найден — кидаем ошибку
        if not user:
            raise HttpError(401, "Пользователь не найден или данные неверны")

        # 3. Генерируем токены для найденного пользователя
        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user_id": user.user_id,
        }