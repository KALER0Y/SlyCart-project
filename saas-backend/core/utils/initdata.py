import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from django.conf import settings
from core.exceptions import SignatureError


def verify_telegram_initdata(initdata: str) -> dict:
    """
    Проверяет подпись Telegram Web App initData и возвращает очищенный словарь пользователя.
    """
    if not initdata:
        raise SignatureError("Пустые данные!")
    
    DEBUG = settings.DEBUG

    try:
        # Решаем МИНУ №5 (KeyError): Безопасно парсим и достаем ключи
        parsed_data = dict(parse_qsl(initdata, keep_blank_values=True))
        
        target_hash = parsed_data.pop('hash')
        auth_date_str = parsed_data.get('auth_date')
        user_json_str = parsed_data.get('user')
        
        if not auth_date_str or not user_json_str:
            raise KeyError
            
        auth_date = int(auth_date_str)
    except (KeyError, ValueError):
        raise SignatureError("Неполные или некорректные данные запроса!")

    # Решаем МИНУ №4 (Clock Desync): Проверяем время жизни по модулю abs()
    current_time = time.time()
    
    if not DEBUG:
        if abs(current_time - auth_date) > 300:
            raise SignatureError("Данные устарели!")

    # Решаем МИНУ №1 (Type Shifting): Используем новые переменные sorted_items и formatted_lines
    sorted_items = sorted(parsed_data.items())
    formatted_lines = [f"{key}={value}" for key, value in sorted_items]
    data_check_string = "\n".join(formatted_lines)

    # Решаем МИНУ №3 (env): Безопасно берем токен из настроек Django
    bot_token = getattr(settings, 'BOT_TOKEN', '')
    if not bot_token:
        raise SignatureError("Токен бота не настроен в settings.py!")

    # Хэшируем ключ бота (без опасных bytearray)
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=bot_token.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()

    # Вычисляем проверочный хэш
    calculated_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()

    # Сравниваем подписи
    if not hmac.compare_digest(calculated_hash, target_hash):
        raise SignatureError("Неверная подпись!")

    # Решаем МИНУ №2 (Безопасный парсинг): Парсим JSON только ПОСЛЕ верификации хэша
    try:
        # Решаем МИНУ №3 (Type Hint): Возвращаем dict, чтобы вьюха получила все данные юзера
        user_data = json.loads(user_json_str)
        return user_data
    except json.JSONDecodeError:
        raise SignatureError("Некорректный формат данных пользователя!")
    
