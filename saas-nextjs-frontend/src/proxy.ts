import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
    matcher: ["/profile/customer/:path*", "/profile/owner/:path*", "/shops/:path*"]
}

// export мы пишем для того, чтобы функция не была "заперта" внутри этого файла и могла спокойно применятся где нам нужно
export async function proxy(request: NextRequest){

    // 1) Получаем куки

    // Если мы не напишем value, то в token будет полная информация, типа специального контейнера.
    // Вопросы я поставил для того, чтобы если пользователь не зарегистрирован, 
    // либо у него нет токена, программа не падала
    const token = request.cookies.get("access")?.value

    // 2) Получаем текущий путь динамически. первый это куда хотим отправить, а второй - информация об ориджине

    const path = request.nextUrl.pathname
    // console.log("middleware сработал, путь:", path)
    const register_url = new URL("/register", request.url)

    // 3) Если путь не /register и нет access токена, то редирект на регистрацию
    if (token == undefined){
        return NextResponse.redirect(register_url)
    }

    // 4) Кодируем секретный ключ в Uint8Array чтобы библиотека jose могла с ним работать на уровне байт(особенность работы)

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    // 5) Работаем с закодированным ключом
    
    try {
        const {payload} = await jwtVerify(token, secret)
        // console.log("🔑 СОДЕРЖИМОЕ ТОКЕНА PAYLOAD:", payload)
        const role = payload.role

        const customer_url = new URL("/profile/customer", request.url) 
        const owner_url = new URL("/profile/owner", request.url)

        if (path.startsWith("/profile/customer") && role == "owner"){
            console.log("Профиль покупателя недоступен для владельца")
            return NextResponse.redirect(owner_url)
        }

        if (path.startsWith("/profile/owner") && role == "customer"){
            console.log("Профиль владельца недоступен для покупателя")
            return NextResponse.redirect(customer_url)
        }

        return NextResponse.next()

    } catch(error) {
        console.log("Ошибка на стороне JWT: ", error)
        const response = NextResponse.redirect(register_url) // Сохраняем ответ
        response.cookies.delete("access") // удаляем куки
        return response
    }
}