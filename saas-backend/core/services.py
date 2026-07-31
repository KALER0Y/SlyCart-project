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
    OrderHistory, 
    Product, 
    CartItem, 
    CustomerProfile,
    OwnerProfile, 
    Shop,
    ProductImage
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


def create_order(customer: CustomerProfile, shop: Shop, cart_items) -> Order:
    """
    Создает заказ, обновляет остатки товаров и очищает корзину.
    Использует атомарную транзакцию для предотвращения Race Condition.
    """
    
    # 1. Базовая проверка: есть ли что-то в корзине
    if not cart_items.exists():
        raise ValueError("Корзина пуста")

    with transaction.atomic():
        # Создаем объект заказа (пока с нулевой ценой)
        order = Order.objects.create(customer=customer, shop=shop)
        
        total_price = 0
        order_items_to_create = []

        # Предварительно подгружаем продукты, чтобы избежать N+1 в цикле
        # (если cart_items еще не вычислен)
        items = cart_items.select_related('product')

        for item in items:
            product = item.product
            quantity = item.quantity

            # 2. Атомарное обновление остатка с проверкой (Race Condition Protection)
            # Мы обновляем только если остатка достаточно (stock__gte=quantity)
            updated_count = Product.objects.filter(
                id=product.id, 
                stock__gte=quantity # Проверка прямо в БД
            ).update(stock=F("stock") - quantity)

            if updated_count == 0:
                # Если ни одна строка не обновилась, значит товара не хватило
                # Транзакция откатится автоматически из-за исключения
                raise ValueError(f"Недостаточно товара '{product.title}' на складе")

            # 3. Формируем список для bulk_create
            order_items_to_create.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.title,
                    quantity=quantity,
                    price_per_item=product.price
                )
            )

            total_price += product.price * quantity

        # 4. Cоздаем все позиции заказа одним запросом
        OrderItem.objects.bulk_create(order_items_to_create)

        # 5. Записываем финальную стоимость
        order.total_price = total_price
        order.save(update_fields=['total_price'])

        # 6. Очищаем корзину
        cart_items.delete()

        return order
    
# def upload_product_images(product: Product, images: list) -> None:
#     """
#     Надежная загрузка изображений.
#     Использует обычный цикл для гарантии сохранения файлов на диск/хранилище.
#     """
#     if not images:
#         return

#     if not isinstance(images, list):
#         images = [images]

#     if len(images) > 6:
#         raise ValueError("Слишком много фотографий! Максимум 6.")

#     with transaction.atomic():
#         # Проверяем наличие главного фото один раз перед циклом
#         has_main_image = product.images.filter(is_main=True).exists()

#         for i, img in enumerate(images):
#             # Делаем фото главным только если у товара ВООБЩЕ нет главного фото
#             # и это самое первое фото в текущем списке
#             is_main = False
#             if not has_main_image and i == 0:
#                 is_main = True

#             ProductImage.objects.create(
#                 product=product,
#                 image=img,
#                 is_main=is_main
#             )
        
def change_main_image(image_id: int) -> None: # Айди фотки из api
    """
    Меняем главную фотографию
    """

    with transaction.atomic():
        image_obj = ProductImage.objects.get(id=image_id)
        ProductImage.objects.filter(product=image_obj.product).update(is_main=False)
        image_obj.is_main = True
        image_obj.save(update_fields=['is_main'])

def delete_image(image_id: int) -> None: # Айди фотки из api
    """
    Удаляем фотографию и если она была главной, то делаем первую попавшуюся главной
    """
    with transaction.atomic():
        image_obj = ProductImage.objects.get(id=image_id)
        was_main = image_obj.is_main
        product = image_obj.product
        image_obj.image.delete(save=False)
        image_obj.delete()

        if was_main:
            first_image = ProductImage.objects.filter(product=product).first()
            if first_image:
                change_main_image(first_image.id)

def change_order_status(order: Order, new_status: str) -> Order:
    """
    Меняет статус заказа
    """

    with transaction.atomic():

        if new_status not in OrderStatus.values:
            raise InvalidOrderStatusError("Недопустимый статус")
        
        if order.status == new_status:
            return order
        
        OrderHistory.objects.create( # Create не требует после себя метода save
            order=order,
            old_status=order.status,
            new_status=new_status
        )

        order.status = new_status # А вот здесь метод save будет нужен
        order.save(update_fields=['status']) # Говорим что именно сохранить в базе данных. + к оптимизации

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
