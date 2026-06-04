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
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            
            # Пропускаем ручку авторизации (там токена еще нет)
            if request.path.endswith("/api/core/register"):
                return self.get_response(request)

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
