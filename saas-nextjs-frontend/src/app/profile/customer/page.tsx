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
      <div className="w-full py-10 text-center font-mono text-sm text-zinc-500">
        Загрузка магазинов...
      </div>
    );
  }

    return(
    <div className="w-full px-4 text-left font-mono mt-4">
      <h2 className="mb-4 border-b border-zinc-800 pb-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
        Все магазины ({data?.length || 0})
      </h2>

      {data?.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          Пока что владельцы зевают...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data?.map((shop) => (
            <Link
              key={shop.id}
              href={`/shops/${shop.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
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
                <h3 className="truncate text-base font-bold text-zinc-100">
                  {shop.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
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