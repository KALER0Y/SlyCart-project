'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    // Создаем QueryClient внутри useState, чтобы он не пересоздавался при рендере
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
        queries: {
            // В SSR режиме крайне важно выставить staleTime больше 0, 
            // чтобы клиент не перевыкачивал данные сразу после загрузки страницы
            staleTime: 60 * 1000, 
        },
        },
    }))


    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
