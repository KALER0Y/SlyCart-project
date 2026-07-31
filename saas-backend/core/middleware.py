from django.http import JsonResponse

class CSRFTokenMiddleware:
    """
    Middleware для проверки CSRF-токена. 
    Сравнивает токен из Cookie и специального заголовка.
    """
    def __init__(self, get_response): # One-time configuration and initialization.
        self.get_response = get_response

    def __call__(self, request):

        # Code to be executed for each request before
        # the view (and later middleware) are called.

        # 1. Проверяем только "опасные" методы
        EXEMPT_PATH = ("/api/core/register", "/api/core/refresh", "/api/core/login")
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            # Пропускаем ручку авторизации (там токена еще нет)
            if any(request.path.endswith(path) for path in EXEMPT_PATH):
                return self.get_response(request)

            # # Пропускаем запросы из swagger
            # referer = request.headers.get("Referer", "")
            # if "/docs" in referer or "/openapi.json" in referer:
            #     return self.get_response(request)

            # 2. Достаем токены
            csrf_cookie = request.COOKIES.get("csrf_token")
            csrf_header = request.headers.get("X-CSRF-Token")

            # 3. Валидация (логика "как лучше")
            if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                return JsonResponse(
                    {
                        "detail": "CSRF verification failed",
                        "help": "Ensure X-CSRF-Token header matches csrf_token cookie."
                    },
                    status=403
                )

        # Если всё ок или метод безопасный (GET) — идем дальше
        return self.get_response(request)
