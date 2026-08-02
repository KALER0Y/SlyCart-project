import type { ReactNode } from "react";
import { Store } from "lucide-react";
import { Toaster } from "@/components/ui/sonner"

interface ShopLayout{
    children: ReactNode
}

export default function ShopCreateInterface({children} : ShopLayout) {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-zinc-950">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
                <header className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                            <Store className="h-4 w-4 text-cyan-400" />
                        </div>
                        <p className="font-mono text-[15px] font-bold tracking-wide text-zinc-100">
                            SlyCart
                        </p>
                    </div>
                    <div className="h-px w-full bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
                </header>

                <main className="flex flex-1 flex-col">
                    {children}
                </main>
            </div>

            <Toaster position="top-center" />
        </div>
    )
}