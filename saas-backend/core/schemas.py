from decimal import Decimal
from typing import List, Optional
from pydantic import PositiveInt
from uuid import UUID
from ninja import Field, Schema, ModelSchema
from ninja_jwt.tokens import RefreshToken
from django.db.models import Q
from ninja.errors import HttpError
from .models import Order, TelegramUser, Product
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


class ProductIn(Schema):
    title: str
    description: str
    price: Decimal = Field(..., max_digits=10, decimal_places=2, ge=0) # ...(элипс) означает что поле обязательное. 
    # Информацию обязательно должен прислать бекэнд или пользователь 
    stock: PositiveInt
    is_active: bool = True


class ProductOut(ModelSchema):
    class Meta:
        model = Product
        fields = ["id", 
                  "image",
                  "title", 
                  "description", 
                  "price", 
                  "stock", 
                  "is_active"]

class ProductPatch(Schema):
    user_id: int
    title: Optional[str]
    description: Optional[str]
    price: Optional[Decimal] 
    stock: Optional[PositiveInt]
    is_active: Optional[bool]

class StoreCreateSchema(Schema):
    name: str
    description: str
    # Фото мы передаем сразу в endpoint

class StoreOutSchema(Schema):
    id: UUID
    name: str
    description: str
    logo_url: str # В ответе всегда отдаем готовую ссылку на сохраненный файл
    is_owner: bool = False

class OrderItemInSchema(Schema):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderInSchema(Schema):
    shop_id: UUID
    items: List[OrderItemInSchema]

class OrderOutSchema(ModelSchema):
    class Meta:
        model = Order
        fields = ['id', 'shop', 'total_price', 'created_at']

class MyTokenObtainPairSchema(Schema):

    user_id: int

    def to_response_schema(self):
        # Используем Q-объекты для реализации логики "ИЛИ" (OR) в SQL-запросе.
        # Это позволяет одним запросом проверить наличие номера телефона 
        # сразу в двух разных таблицах профилей (Customer и Owner), 
        # связанных с пользователем через ForeignKey.
        user = TelegramUser.objects.select_related("customer_profile", "owner_profile").filter(
            Q(user_id=self.user_id)).first() # Самое первое что нашли

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