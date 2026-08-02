import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner"

interface ShopLayout{
    children: ReactNode
}

export default function ShopCreateInterface({children} : ShopLayout) {
    return (
        <div className="relative flex flex-col min-h-screen py-4 w-full max-w-md mx-auto border-3 rounded-2xl">
            <header className="flex flex-col justify-center items-center text-[16px]">
                <p className="font-serif">SlyCart</p>
                <p className="w-full border-b mt-4 border-3"></p>
            </header>
            <main className="">
                {children}
            </main>
        </div>
    )
}