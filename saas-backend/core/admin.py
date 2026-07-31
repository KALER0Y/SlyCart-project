from django.contrib import admin
from .models import TelegramUser, CustomerProfile, OwnerProfile, Shop, Product, CartItem, Order, OrderHistory, OrderItem, ProductImage

# Register your models here.

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

@admin.register(TelegramUser)
class TelegramUserAdmin(UserAdmin):
    # Убираем фильтры по датам, которых у нас нет (например, date_joined)
    # и оставляем только то, что есть в нашей модели
    list_display = ('user_id', 'role', 'reg_date', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('user_id',)
    ordering = ('-reg_date',)
    
    # Настраиваем блоки в админке под нашу модель
    fieldsets = (
        (None, {'fields': ('user_id', 'password')}),
        ('Персональная информация', {'fields': ('role',)}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Важные даты', {'fields': ('last_login', 'reg_date')}),
    )
    
    # Поля, которые нельзя редактировать вручную
    readonly_fields = ('reg_date', 'last_login')
    
    # UserAdmin по умолчанию требует эти поля для создания юзера через админку
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_id', 'role', 'is_staff', 'is_active'),
        }),
    )


admin.site.register(CustomerProfile)
admin.site.register(OwnerProfile)
admin.site.register(Shop)
admin.site.register(Product)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(OrderHistory)
admin.site.register(OrderItem)
admin.site.register(ProductImage)