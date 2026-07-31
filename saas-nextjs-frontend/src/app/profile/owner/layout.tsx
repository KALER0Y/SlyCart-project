import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner"

interface ShopLayout{
    children: ReactNode
}

export default function ShopCreateInterface({children} : ShopLayout) {
    return (
        <div className="relative flex flex-col min-h-screen py-3 w-full max-w-md mx-auto bg-zinc-900">
            <header className="flex flex-col justify-center items-center text-[16px]">
                <p className="font-serif">SlyCart</p>
            </header>
            <main className="">
                {children}
            </main>
            <Toaster position="top-center"/>
        </div>
    )
}