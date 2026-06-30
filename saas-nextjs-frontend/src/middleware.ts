import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// export мы пишем для того, чтобы функция не была "заперта" внутри этого файла и могла спокойно применятся где нам нужно
export function middleware(request: NextRequest){

    // 1) Получаем куки

    // Если мы не напишем value, то в token будет полная информация, типа специального контейнера.
    // Вопросы я поставил для того, чтобы если пользователь не зарегистрирован, 
    // либо у него нет токена, программа не падала
    const token = request.cookies.get("access")?.value

    // 2) 
}