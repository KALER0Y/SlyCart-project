def set_auth_cookie(response,  access_token: str, refresh_token: str, csrf_token: str, debug_status: bool):
    """
    Общая функция для запекания всех авторизационных кук в ответ сервера
    """

    REFRESH_MAX_AGE = 60 * 60 * 24 * 7 
    # Запекаем Access токен
    response.set_cookie(
        key="access",
        value=access_token,
        httponly=True,      # Защита от XSS атака(межсайтовый код). Такие куки автоматически прикрепляются к браузеру
        secure=not debug_status,
        samesite="Lax",     # Защита от CSRF-атак(только на базовом уровне)
        max_age=60 * 60,
    )
    # Запекаем Refresh токен
    response.set_cookie(
        key="refresh",
        value=refresh_token,
        httponly=True,
        secure=not debug_status,
        samesite="Lax", 
        max_age=REFRESH_MAX_AGE,
    )
    # Запекаем CSRF-токен (он должен жить столько же сколько и refresh)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=not debug_status,
        samesite="Lax",
        max_age=REFRESH_MAX_AGE,
    )
