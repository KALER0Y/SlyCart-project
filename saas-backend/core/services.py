import logging

from decimal import Decimal
from typing import List
import uuid
from ninja import File
from ninja.files import UploadedFile
from django.db import transaction
from django.db import models
from django.db.models import F
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404

from .schemas import OrderInSchema

from .exceptions import (
    UserAlreadyExistsError, 
    InvalidRoleError,
    ShopLimitExceededError,
    BrandAlreadyTakenError,
    InvalidOrderStatusError,
    PhoneNumberAlreadyTakenError,
    EmptyPhoneNumberError,
    ShopAlreadyExists,
    ProductLimitExceededError,
    NegativePriceError
)

from .models import (
    TelegramUser,
    Order, 
    OrderItem,
    Product, 
    CustomerProfile,
    OwnerProfile, 
    Shop,
)

logger = logging.getLogger(__name__)


class OrderStatus(models.TextChoices):
    PENDING = "pending", _("Ожидает оплаты")
    PAID = "paid", _("Оплачен")
    SHIPPED = "shipped", _("Отправлен")
    COMPLETED = "completed", _("Завершен")
    CANCELED = "canceled", _("Отменен")


class ProfileRole(models.TextChoices):
    CUSTOMER = "customer", _("Покупатель")
    OWNER = "owner", _("Владелец")


def create_order(customer: CustomerProfile, shop: Shop, data: OrderInSchema) -> Order:
    """
    Создает заказ, обновляет остатки товаров.
    Использует атомарную транзакцию для предотвращения Race Condition.
    """
    with transaction.atomic():

        # 1) Проверка на то, есть ли у нас данные
        if not data.items:
            raise ValueError("Пустая корзина")

        # 2) Создаем заказ
        order = Order.objects.create(customer=customer, shop=shop, total_price=0)

        # 3) Счетчик для ИТОГО
        total_price = Decimal("0.00")

        # 4) Цикл для работы с заказами
        for item in data.items:
            # Ищем товар
            product = get_object_or_404(Product, id=item.product_id)

            # Больше ли его чем нужно?
            if product.stock < item.quantity:
                raise ValueError("Товара не достаточно на складе!")
            
            # Если больше, то отнимаем количество
            product.stock -= item.quantity
            product.save(update_fields=['stock'])

            # Создаем заказ
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.title,
                quantity=item.quantity,
                price_per_item=product.price
            )

            # Высчитываем общую сумму
            total_price += product.price * item.quantity

        # Сохраняем общую сумму
        order.total_price = total_price
        order.save(update_fields=["total_price"])

        return order

    
def create_user(telegram_id: int, 
                role: str) -> TelegramUser:
      """
      Создает пользователя в зависимости от роли
      """
      
      with transaction.atomic():

        logger.info("Началось создание пользователя")

        if role not in ProfileRole.values:
            raise InvalidRoleError("Такой роли не существует!")
        
        if TelegramUser.objects.filter(user_id=telegram_id).exists():
            raise UserAlreadyExistsError("Такой пользователь уже существует!")
        
        tg_user = TelegramUser.objects.create(
            user_id=telegram_id,
            role=role
        )

        if role == ProfileRole.OWNER.value:
            create_owner_profile(user=tg_user)
        else:
            create_customer_profile(user=tg_user)

        logger.info(f"Пользователь {tg_user.user_id} с ролью {tg_user.get_role_display()} успешно создан!")
        return tg_user

def create_customer_profile(user: TelegramUser) -> CustomerProfile:
    """
    Создает профиль покупателя
    """
    with transaction.atomic():
        logger.info("Создание профиля покупателя")

        return CustomerProfile.objects.create(
            customer=user
        )
        
def create_owner_profile(user: TelegramUser) -> OwnerProfile:
    """
    Создает профиль продавца
    """
    with transaction.atomic():
        logger.info("Создание профиля продавца")
        # Этот метод создает кортеж, поэтому достаем первую запись
 
        return OwnerProfile.objects.create(
            owner=user,
        )
    
def create_shop(user: OwnerProfile, name: str, description: str, logo_file: File) -> Shop:
    """
    Создает магазин
    """

    with transaction.atomic():
        # 1) Достаем расширение файла
        ext = logo_file.name.split('.')[-1]
        # 2) Кладем его в указанный репозиторий
        file_name = f'shops/logos/{uuid.uuid4()}.{ext}'
        # 3) Сохраняем файл
        default_storage.save(file_name, logo_file)

        # 4) Сохраняем путь
        file_path = default_storage.url(file_name)

        shop = Shop.objects.create(
            owner=user,
            name=name,
            description=description,
            logo_url=file_path
        )

        return shop
    
def create_product(shop: Shop, 
                   title: str, 
                   description: str, 
                   price: Decimal,
                   image: UploadedFile, 
                   stock: int,
                   is_active: bool = True) -> Product:
    """
    Создает товар для магазина
    """

    with transaction.atomic():
        
        if not image:
            raise ValueError("Нет фотографии товара!")

        # 1) Достаем расширение файла
        file_ext = image.name.split(".")[-1]

        # 2) Сохраняем файл
        file = f"shops/product_images/{uuid.uuid4()}.{file_ext}"
        default_storage.save(file, image)

        # 3) Достаем путь
        url_image = default_storage.url(file)
        
        product = Product.objects.create(
            shop=shop,
            title=title,
            description=description,
            price=price,
            stock=stock,
            image=url_image,
            is_active=is_active
        )

        return product
