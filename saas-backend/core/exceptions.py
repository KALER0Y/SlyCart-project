class BaseServiceException(Exception): 
    """Базовое исключение для всех сервисов нашего проекта"""
    def __init__(self, message="Произошла ошибка в работе сервиса"):
        self.message = message
        super().__init__(self.message)

# Ошибки регистрации
class UserAlreadyExistsError(BaseServiceException):
    """Пользователь с таким ID уже есть"""
    pass

class InvalidRoleError(BaseServiceException):
    """Передана несуществующая роль"""
    pass

# Ошибки магазинов и тарифов
class ShopLimitExceededError(BaseServiceException):
    """Превышен лимит создания магазинов для текущего тарифа"""
    pass

class ProductLimitExceededError(BaseServiceException):
    """Превышен лимит создания товаров для текущего тарифа"""
    pass

class BrandAlreadyTakenError(BaseServiceException):
    """Название бренда уже занято другим владельцем"""
    pass

class InvalidOrderStatusError(BaseServiceException):
    """Несуществующий статус заказа"""
    pass

class EmptyPhoneNumberError(BaseServiceException):
    """Пустой номер телефона у покупателя"""
    pass

class PhoneNumberAlreadyTakenError(BaseServiceException):
    """Такой номер телефона уже занят"""
    pass

class ShopAlreadyExists(BaseServiceException):
    """Такой магазин уже существует"""
    pass

class NegativePriceError(BaseServiceException):
    """Отрицательная цена для товара"""
    pass

class NoProductImages(BaseServiceException):
    """Отсутствуют фотографии для товара"""
    pass

class SignatureError(BaseServiceException):
    """Ошибка проверки подлинности подписи"""
    pass