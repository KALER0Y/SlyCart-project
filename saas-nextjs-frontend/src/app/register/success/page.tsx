"use client" // 1. Обязательно сообщаем Next.js, что это клиентский компонент

import { useRouter } from "next/navigation" // 2. Импортируем правильный роутер
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export default function RegisterSuccessPage() {
    const router = useRouter() // 3. Инициализируем роутер

    return (
        // В TWA лучше использовать h-[90vh] вместо min-h-100, чтобы не появлялся скролл под экраном Telegram
        <div className="flex items-center justify-center h-[90vh] p-4">
            <Card className="w-full max-w-md border-border bg-secondary/20 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Регистрация успешна!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    Ваш аккаунт создан. Теперь вы можете перейти в личный кабинет мерчанта SlyCart.
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6"
                        onClick={() => router.push("/")} // 4. Меняем window.location на быстрый переход Next.js
                    >
                        В личный кабинет
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
