from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

import uuid # Для shop_id, order_id

# Нам нужен менеджер, чтобы Django не ругался при создании суперпользователя
class TelegramUserManager(BaseUserManager):
    def create_user(self, user_id, password=None, **extra_fields):
        if not user_id:
            raise ValueError('Поле user_id должно быть заполнено')
        
        user = self.model(user_id=user_id, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password() # Обычным юзерам пароль не нужен. 
            # Джанго поставит им невалидный хэш и защитит от подбора пароля
            
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(user_id, password, **extra_fields)

# Create your models here.
# Мы используем PermissionsMixin для интеграции с Django Admin (исправляет E019).
class TelegramUser(AbstractBaseUser, PermissionsMixin):

    user_id = models.BigIntegerField(unique=True, 
                                     verbose_name="ID телеграмм пользователя")
    
    # Эти поля обязательны для AbstractBaseUser, чтобы Django понимал, что это юзер
    password = models.CharField(max_length=128, null=True, blank=True) # Нам не нужен пароль, но чтобы не ругался, сделаем так
    last_login = models.DateTimeField(auto_now=True, null=True, blank=True)

    # Указываем, какое поле будет "логином" для Django
    USERNAME_FIELD = 'user_id' 
    REQUIRED_FIELDS = [] # При создании суперпользователя спросит только ID и пароль

    objects = TelegramUserManager()

    is_active = models.BooleanField(
        default=True, 
        verbose_name="Активен",
        help_text="Снимите галочку, если хотите заблокировать пользователя без удаления."
    )

    is_staff = models.BooleanField(default=False, verbose_name="Статус персонала") # Для админки

    ROLE_CHOICES = [
        ('customer', 'Покупатель'),
        ('owner', 'Владелец'),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES, # Первое для базы(customer), второе для админки(Покупатель)
        default='customer',
        verbose_name="Роль"
    )

    reg_date = models.DateField(auto_now_add=True) #Автодобавление даты регистрации


    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи" 
    
    def __str__(self):
        return f"Пользователь: {self.user_id} ({self.role})"


class Tariff(models.Model):

    plan = models.CharField(max_length=50, 
                            verbose_name="Тариф")
    
    max_products = models.PositiveSmallIntegerField(verbose_name="Лимит товаров",
                                                    default=10)

    max_shops = models.PositiveSmallIntegerField(verbose_name="Лимит магазинов",
                                                 default=1)

    # max_digit - максимальное количество цифр в числе, decimal_places - знаки после запятой
    price = models.DecimalField(max_digits=10,
                                decimal_places=2, 
                                verbose_name="Цена тарифа",
                                default=0.00)
    
    description = models.TextField(verbose_name="Описание тарифа", 
                                   blank=True, 
                                   null=True)
    # blank позволяет быть полю пустым, а null будет сохранять пустые значение как NULL

    class Meta:
        verbose_name = "Тариф"
        verbose_name_plural = "Тарифы" # Чтобы в админке не было "Тарифs"

    def __str__(self):
        return f'Тариф: {self.plan} -> Цена: {self.price}₽, Лимиты(товары/магазины): {self.max_products}/{self.max_shops}'


class CustomerProfile(models.Model):

    customer = models.OneToOneField(to=TelegramUser, 
                                    on_delete=models.CASCADE, 
                                    related_name="customer_profile", # Для OneToOne в единственном числе
                                    verbose_name="Покупатель")
    
    phone = PhoneNumberField(verbose_name="Номер телефона", 
                            null=True, 
                            blank=True,
                            unique=True,
                            region="RU")
    
    def clean(self): # "Костыль" для админки
        if self.customer.role != "customer":
            raise ValidationError(
                f"Пользователь {self.customer.user_id} не является покупателем"
                )
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
                
    
    class Meta:
        verbose_name = "Покупатель"
        verbose_name_plural = "Покупатели"

    def __str__(self):
        return f'Покупатель: {self.customer}, телефон: {self.phone}'
    

class OwnerProfile(models.Model):

    owner = models.OneToOneField(to=TelegramUser,
                                 on_delete=models.CASCADE,
                                 related_name="owner_profile",
                                 verbose_name="Владелец")
    
    # forein key в тарифах - база, потому что один тариф для всех пользователей, а не для одного.
    tariff = models.ForeignKey(to=Tariff,
                               on_delete=models.SET_NULL,
                               null=True,
                               verbose_name="Тариф")
    
    brand_name = models.CharField(max_length=120,
                                  null=True,
                                  blank=True,
                                  unique=True,
                                  verbose_name="Название бренда")
    
    phone = PhoneNumberField(verbose_name="Номер телефона", 
                            null=True, 
                            blank=True,
                            unique=True,
                            region="RU")
    
    owner_inn = models.CharField(verbose_name="Инн владельца",
                                 max_length=12,
                                 null=True,
                                 unique=True,
                                 blank=True)
    
    def clean(self):
        if self.owner.role == "customer":
            raise ValidationError(
                f"Невозможно создать профиль владельца для пользователя {self.owner.user_id}, "
                f'так как его роль - {self.owner.role}'
            )
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Владелец"
        verbose_name_plural = "Владельцы"

    def __str__(self):
        return f'{self.owner}, {self.tariff}, бренд: {self.brand_name}'
    

class Shop(models.Model):

    id = models.UUIDField(primary_key=True,
                          default=uuid.uuid4,
                          editable=False)

    owner = models.ForeignKey(to=OwnerProfile, 
                              on_delete=models.CASCADE, 
                              verbose_name="Владелец",
                              related_name="shops") # Если удалим владельца, удалиться вся информация о магазине(CASCADE)
    # Все о пользователе(тариф, дата регистрации, телеграм айди и т.д)
    # on_delete работает на тех, на кого мы ссылаемся
  
    shop_name = models.CharField(max_length=100,
                                 verbose_name="Название магазина")
    
    shop_link = models.SlugField(unique=True, 
                                 verbose_name="Ссылка (slug)")
    
    def clean(self): # Метод clean нужен для валидации данных
        if self.owner.owner.role != 'owner': # "Костыль" для админки
            raise ValidationError(
                f"Пользователь {self.owner.owner.role} не является владельцем и не может создать магазин"
            )
        
    def save(self, *args, **kwargs):
        self.full_clean() # Принудительно вызвать метод clean, не только в админке, а везде
        super().save(*args, **kwargs)


    class Meta:
        verbose_name = "Магазин"
        verbose_name_plural = "Магазины"

        
    def __str__(self):
        return f"Магазин: {self.shop_name}, link = {self.shop_link}"
    

class Product(models.Model):
    
    shop = models.ForeignKey(to=Shop, 
                             on_delete=models.CASCADE,
                             verbose_name="Магазин",
                             related_name="products")
    # Если удалят магазин, вся информация о продуктах тоже удалиться
    
    title = models.CharField(max_length=100, 
                             verbose_name="Название товара")
    
    description = models.TextField(verbose_name="Описание товара")

    price = models.DecimalField(max_digits=10, 
                                decimal_places=2, 
                                verbose_name="Цена товара")
    
    created_at = models.DateTimeField(verbose_name="Дата создания",
                                      auto_now_add=True)
    
    is_active = models.BooleanField(verbose_name="Доступен ли товар", 
                                    default=True)
    
    stock = models.PositiveIntegerField(verbose_name="Осталось товара", 
                                        default=1)

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        indexes = [
            models.Index(fields=["shop", "is_active"], name="goods_in_stock_idx"),
            models.Index(fields=["shop", "price"], name="sorted_prices_idx")
            # В name нельзя ставить пробелы, так как это технические имена
            # Индексы нужны для оптимизации запросов, без индексов базе данных приходиться перебирать все
            # Можно было бы поставить в поля db_index=True, но этот вариант лучше
        ]

    def __str__(self):
        return f"Товар/цена/кол-во: {self.title} : {self.price} : {self.stock}. В наличии: {self.is_active}"


class CartItem(models.Model):

    customer = models.ForeignKey(to=CustomerProfile, 
                                 on_delete=models.CASCADE, 
                                 verbose_name="Покупатель")
    
    product = models.ForeignKey(to=Product, 
                                on_delete=models.CASCADE, 
                                verbose_name="Товар")
    
    updated_at = models.DateTimeField(auto_now=True, 
                                      verbose_name="Дата изменения заказа")
    
    quantity = models.PositiveSmallIntegerField(verbose_name="Количество товара",
                                                default=1)


    class Meta:
        verbose_name = "Корзина"
        verbose_name_plural = "Корзины"
        constraints = [
            models.UniqueConstraint( # Чтобы не было дублей в товарах, меняется только количество, покупатель и товар не меняется!
                fields=['customer','product'],
                name="unique_product"
            )
        ] 
        
    
    def __str__(self):
        return f"Покупатель {self.customer}, товар: {self.product}, кол-во: {self.quantity}"


class Order(models.Model):

    id = models.UUIDField(primary_key=True,
                          default=uuid.uuid4,
                          editable=False)

    customer = models.ForeignKey(to=CustomerProfile, 
                                 on_delete=models.PROTECT, 
                                 verbose_name="Покупатель")
    
    shop = models.ForeignKey(to=Shop, 
                             on_delete=models.PROTECT, 
                             verbose_name="Магазин")
    
    total_price = models.DecimalField(max_digits=10, 
                                      decimal_places=2, 
                                      verbose_name="Общая цена", 
                                      default=0)
    
    created_at = models.DateTimeField(verbose_name="Дата создания",
                                      auto_now_add=True)
    
    updated_at = models.DateTimeField(verbose_name="Дата обновления",
                                      auto_now=True)

    CHOICES = [
        ("pending", "Ожидает оплаты"),
        ("paid", "Оплачен"),
        ("shipped", "Отправлен"),
        ("completed", "Завершен"),
        ("canceled", "Отменен"),
    ]

    status = models.CharField(max_length=20, 
                              choices=CHOICES, 
                              default='pending', 
                              verbose_name="Статус товара")

    
    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"

    def __str__(self):
        return f"Покупатель: {self.customer}, магазин: {self.shop.shop_name}, к оплате: {self.total_price}, статус: {self.status}"


class OrderHistory(models.Model):

    order = models.ForeignKey(to=Order,
                              verbose_name="Заказ",
                              related_name="history",
                              on_delete=models.CASCADE) # Без самого заказа нет смысла хранить историю
    
    old_status = models.CharField(max_length=40,
                              verbose_name="Статус(старый)")
    
    new_status = models.CharField(max_length=40,
                                  verbose_name="Статус(новый)")
    
    created_at = models.DateTimeField(verbose_name="Дата изменения",
                                      auto_now_add=True)
    
    class Meta:
        verbose_name = "История заказа"
        verbose_name_plural = "История заказов"


class OrderItem(models.Model):

    order = models.ForeignKey(to=Order, 
                              on_delete=models.CASCADE, 
                              verbose_name="Заказ", 
                              related_name="items") 
    # Если удалиться заказ, то следовательно нужно и удалить товары в нем
    product = models.ForeignKey(to=Product, 
                                on_delete=models.SET_NULL, 
                                verbose_name="Товар",
                                null=True,
                                blank=True)
    # Если уберут товар, то просто оставим так, что товара нет, но тогда строчка с товаром останется пустой
    # Значит, ее нужно сохранить
    product_name = models.CharField(verbose_name="Товар(сохранненый)", 
                                    max_length=255, 
                                    null=False)
    # Сохраняем сюда название товара
    quantity = models.PositiveSmallIntegerField(verbose_name="Количество товаров в заказе")
    # Сохраняем количество товара из корзины сюда
    price_per_item = models.DecimalField(verbose_name="Цена за штуку", 
                                         max_digits=10, 
                                         decimal_places=2)
    # Цена за штуку, чтобы легче было считать

    class Meta:
        verbose_name = "Товар в заказе"
        verbose_name_plural = "Заказы с товарами"

    def __str__(self):
        return f"Номер заказа: {self.order.id}, кол-во: {self.quantity}, цена за штуку: {self.price_per_item}"


class ProductImage(models.Model):
    
    product = models.ForeignKey(to=Product, 
                                on_delete=models.CASCADE, 
                                related_name="images",
                                verbose_name="Товар")
    
    image = models.ImageField(verbose_name="Изображение", 
                                upload_to="products/gallery/%Y/%m/%d/",
                                )
    
    is_main = models.BooleanField(verbose_name="Главное изображение",
                                  default=False)
                
    # Лучше всего методы save, delete не писать именно в базе, а в service layer
    
    class Meta:
        verbose_name = "Изображение товара"
        verbose_name_plural = "Изображения товаров"

    def __str__(self):
        return f"Фото для {self.product.title} {'(Главное)' if self.is_main else ''}"
    