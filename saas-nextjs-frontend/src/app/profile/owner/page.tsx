"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { User, Store, ShoppingBag, Zap, CreditCard, Copy, Check } from "lucide-react"

// Имитируем данные, которые прилетят из Django Ninja в будущем
const mockMerchantData = {
    username: "Анапский Мерчант",
    userId: "123456789",
    tariff: "Бесплатный",
    limits: {
        shopsUsed: 1,
        shopsMax: 1,
        productsUsed: 4,
        productsMax: 10,
    }
}

export default function ProfilePage() {
    const [copied, setCopied] = useState(false)

    const handleCopyId = () => {
        navigator.clipboard.writeText(mockMerchantData.userId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Рассчитываем процент заполненности лимитов для шкал Progress
    const shopPercentage = (mockMerchantData.limits.shopsUsed / mockMerchantData.limits.shopsMax) * 100
    const productPercentage = (mockMerchantData.limits.productsUsed / mockMerchantData.limits.productsMax) * 100

    return (
        // h-[90vh] гарантирует, что в TWA интерфейс встанет ровно без лишних скроллов
        <div className="flex flex-col gap-4 p-4 bg-background text-foreground min-h-[90vh] max-w-md mx-auto">
            
            {/* Карточка 1: Основная информация о пользователе */}
            <Card className="border-border bg-secondary/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl font-bold">{mockMerchantData.username}</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>ID: {mockMerchantData.userId}</span>
                            <button onClick={handleCopyId} className="hover:text-foreground transition-colors">
                                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Карточка 2: Тарифный план и лимиты (SaaS-метрики) */}
            <Card className="border-border bg-secondary/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                            Текущий статус
                        </CardDescription>
                        <Badge variant="secondary" className="bg-blue-600/10 text-blue-500 border-none font-medium px-2.5 py-0.5 rounded-full text-xs">
                            {mockMerchantData.tariff}
                        </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 mt-1">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" /> Лимиты платформы
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-5">
                    {/* Лимит на Магазины */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Store className="w-4 h-4 text-blue-500" /> Магазины
                            </span>
                            <span>{mockMerchantData.limits.shopsUsed} / {mockMerchantData.limits.shopsMax}</span>
                        </div>
                        {/* Компонент Progress из shadcn */}
                        <Progress value={shopPercentage} className="h-2 bg-secondary" />
                    </div>

                    {/* Лимит на Товары */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <ShoppingBag className="w-4 h-4 text-purple-500" /> Товары в каталоге
                            </span>
                            <span>{mockMerchantData.limits.productsUsed} / {mockMerchantData.limits.productsMax}</span>
                        </div>
                        <Progress value={productPercentage} className="h-2 bg-secondary" />
                    </div>
                </CardContent>
            </Card>

            {/* Блок Продаж (Upsell-кнопка для перехода на премиум) */}
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl py-6 flex items-center justify-center gap-2 mt-auto shadow-lg shadow-blue-600/10">
                <CreditCard className="w-5 h-5" /> Улучшить тариф до PRO
            </Button>
            
        </div>
    )
}
