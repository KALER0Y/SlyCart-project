"use client"

import Link from "next/link";
import { authApi } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

export default function AllStores(){

const {data, isLoading} = useQuery({
queryKey: ["all-stores"],
queryFn: authApi.all_shops
    })

if (isLoading) {
return (
      <div className="w-full px-4 pt-4 font-mono">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="aspect-video w-full animate-pulse rounded-xl bg-zinc-800" />
              <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-800/70" />
            </div>
          ))}
        </div>
      </div>
    );
  }

return(
<div className="w-full px-4 text-left font-mono mt-4">
<h2 className="mb-4 border-b border-zinc-800 pb-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
        Все магазины ({data?.length || 0})
</h2>

{data?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-zinc-500">
          <p>Пока что владельцы зевают...</p>
          <p className="text-xs text-zinc-600">Загляните позже — здесь появятся новые магазины</p>
        </div>
      ) : (
<div className="grid grid-cols-2 gap-4">
{data?.map((shop) => (
<Link
key={shop.id}
href={`/shops/${shop.id}`}
className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/30"
>
{/* Картинка логотипа */}
<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800">
<img
src={shop.logo_url}
alt={shop.name}
className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
/>
</div>

{/* Название и описание */}
<div className="mt-3 flex flex-col flex-1 justify-between">
<h3 className="truncate text-sm font-bold text-zinc-100">
{shop.name}
</h3>
<p className="mt-1 line-clamp-2 text-xs text-zinc-500">
{shop.description}
</p>
</div>
</Link>
          ))}
</div>
      )}
</div>
    )
}