import hashlib
import hmac

import pytest
import time

from urllib.parse import urlencode
import json
from core.utils import verify_telegram_initdata
from django.conf import settings
from core.exceptions import SignatureError



# Example initData:
#  query_id=AAHdJu0oAAAAAN0m7SgX7By1&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%2C%22is_premium%22%3Atrue%7D&auth_date=1783611300&hash=c4e8d3b8a1eef20c5d72f7c03c53907c1264c39174f8bb6d8a2456e71912a321

def generate_fake_data(auth_date: int = None, fake_hash: str = None) -> str:
    
    # 1) Создаем данные
    fake_data = {
        "query_id": "AAHdJu0oAAAAAN0m7SgX7By1",
        "user": json.dumps(
            {
                "id": 123456789,
                "first_name": "John",
                "last_name": "Doe",
                "username": "johndoe",
                "language_code": "en",
                "is_premium": True
            },
            separators=(",", ":")
        ),
        "auth_date": auth_date if auth_date else int(time.time()),
    }

    # 2) Сортируем
    sort_data = sorted(fake_data.items())

    # 3) Превращаем лист в строку
    formated_list = [f'{key}={value}' for key, value in sort_data]
    data_string = "\n".join(formated_list)

    if not fake_hash:
        # 4) Шифруем ключ
        bot_token = "mega_secret_bot_token"
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()

        # 5) Шифруем все
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_string.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()

        # 6) добавляем в данные
        fake_data['hash'] = calculated_hash
    else:
        fake_data['hash'] = fake_hash

    # 7) Создаем query-строку
    query_string = urlencode(fake_data)

    return query_string

def test_verify_telegram_initdata_success():
    settings.BOT_TOKEN = "mega_secret_bot_token"
    result = verify_telegram_initdata(generate_fake_data())
    assert result['id'] == 123456789

def test_verify_empty_data():
    with pytest.raises(SignatureError) as exc_info:
        verify_telegram_initdata("")
    assert str(exc_info.value) == "Пустые данные!"

def test_expired_auth():
    expired_time = int(time.time()) - 500
    future_time = int(time.time()) + 500
    with pytest.raises(SignatureError, match="Данные устарели!"):
        verify_telegram_initdata(generate_fake_data(expired_time))
    with pytest.raises(SignatureError, match="Данные устарели!"):
        verify_telegram_initdata(generate_fake_data(future_time))


def test_invalid_hash():
    with pytest.raises(SignatureError, match="Неверная подпись!"):
        verify_telegram_initdata(generate_fake_data(fake_hash="super_duper_fake_hash1123123"))

