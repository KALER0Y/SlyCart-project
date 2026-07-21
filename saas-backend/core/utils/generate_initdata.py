import hashlib
import hmac
import json
import time
import random
from urllib.parse import urlencode

from django.conf import settings
from core.exceptions import SignatureError

def generate_fake_data() -> str:
    
    # 1) Создаем данные
    fake_data = {
        "query_id": "AAHdJu0oAAAAAN0m7SgX7By1",
        "user": json.dumps(
            {
                "id": random.randint(1, 1000),
                "first_name": "John",
                "last_name": "Doe",
                "username": "johndoe",
                "language_code": "en",
                "is_premium": True
            },
            separators=(",", ":")
        ),
        "auth_date": int(time.time()),
    }

    # 2) Сортируем
    sort_data = sorted(fake_data.items())

    # 3) Превращаем лист в строку
    formated_list = [f'{key}={value}' for key, value in sort_data]
    data_string = "\n".join(formated_list)

    TOKEN = settings.BOT_TOKEN


    # 4) Шифруем ключ
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=TOKEN.encode('utf-8'),
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


    # 7) Создаем query-строку
    query_string = urlencode(fake_data)

    return query_string