"use client"

import { useParams } from "next/navigation"
import { components } from "@/types/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox"
import { ImageIcon, PackagePlus, X } from "lucide-react";
import api, { authApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type ProductIn = components['schemas']['ProductIn']

export default function Products() {
    const params = useParams();
    const shopId = params.shop_id;

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"file">("file");

    const handleClearImage = () => {
    setPreviewUrl(null);
    };

    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("1")
    const [isActive, setActive] = useState<boolean>(true)

    const {data: shop, isLoading: isShopLoading} = useQuery({
        queryKey: ["shop", shopId],
        queryFn: () => authApi.get_shop_owner(shopId as string),
        enabled: Boolean(shopId)
    })

    const {data: product, isLoading: isProductsLoading} = useQuery({
        queryKey: ["products", shopId],
        queryFn: () => authApi.get_products(shopId as string),
        enabled: Boolean(shopId) // Делает сетевой запрос только когда достали shop_id
    })

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault(); // Чтобы не перезагружать страницу
        
        // 1. Проверяем, а не пустые ли данные?
        
        if (!title.trim() || !description.trim() || !price || !stock || !file){
        toast.warning("Заполните все поля и загрузите фотографию")
        return;
        }
        
        // 2. Если все нормально, то собираем файлы
        const formData = new FormData();
        
        formData.append("title", title) 
        formData.append("description", description)
        formData.append("price", price)
        formData.append("stock", stock)
        formData.append("is_active", String(isActive)) 
        formData.append("image", file) 

        // 3. Отправляем файлы
        
        await api.post(`shops/${shopId}/product`, formData, {
        headers: {
            'Content-Type': undefined
        }
        })

        toast.success("Товар успешно опубликован!")

        // 4. Очищаем модалку и сбрасываем формы
        setIsOpen(false); // Закрываем модалку
        setTitle("");       // Очищаем форму
        setDescription("");
        setPrice("");
        setStock("1");
        setActive(true);
        setFile(null);
        setPreviewUrl(null);
    }

    if (isShopLoading || isProductsLoading) {
        return (
            <div className="flex min-h-[60vh] w-full items-center justify-center font-mono text-sm text-zinc-500">
            Загрузка магазина...
            </div>
        );
        }
    
    return (
        <div className="flex flex-col items-center justify-center text-center">
            {product?.length === 0 ? (
                <>
                    {shop?.is_owner === true ? (
                        <>
                            <div className="mt-20 flex h-20 w-20 items-center justify-center gap-8 rounded-2xl border border-zinc-800 bg-zinc-900">
                                {/* <p>{shopId}</p> */}
                                <PackagePlus className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div className="mt-4 flex flex-col items-center justify-center gap-4 font-mono">
                                <p className="text-2xl font-bold">Пока что товаров нет</p>
                                <p className="text-[18px] text-gray-500">
                                Создайте свой первый товар для вашего нового магазина.
                                </p>

                                <Button
                                className="mt-3 rounded-[15px] bg-cyan-500 px-10 py-6 text-[18px] text-white font-bold hover:bg-cyan-600"
                                onClick={() => setIsOpen(true)}
                                >
                                + Создать товар 
                                </Button>
                            </div>                 
                        </> 
                    ) : (
                    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center font-mono">
                    <p className="text-base text-zinc-400 font-bold">
                        Зайдите позже, владелец еще не добавил товары в этот магазин.
                    </p>
                    </div>
                    )}
                </>
             ) : (
                <div className="w-full px-4 text-left font-mono mt-4">
                <h2 className="mb-4 border-b border-zinc-800 pb-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
                    Товары ({product?.length || 0})
                </h2>

                {/* Сетка товаров */}
                <div className="grid grid-cols-2 gap-4">
                    {product?.map((product) => (
                    <div
                        key={product.id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        {/* Картинка товара */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-800">
                        <img
                            src={product.image}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        </div>

                        {/* Контент товара */}
                        <div className="mt-3 flex flex-col flex-1 justify-between">
                        <div>
                            <h3 className="truncate text-base font-bold text-zinc-100">
                            {product.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                            {product.description}
                            </p>
                        </div>

                        {/* Цена и наличие */}
                        <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2">
                            <span className="text-sm font-bold text-cyan-400">
                            {product.price} ₽
                            </span>

                            <span className="text-[10px] text-zinc-500">
                            {product.is_active && product.stock > 0
                                ? `В остатке: ${product.stock}`
                                : "Нет в наличии"}
                            </span>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                    <div>
                        {shop?.is_owner && (
                        <Button
                            className="absolute bottom-6 right-3 z-50 h-12 rounded-full bg-cyan-500 text-white font-bold shadow-lg"
                            onClick={() => setIsOpen(true)}
                            >
                            + Создать товар 
                        </Button>
                        )}
                    </div>
                </div>
            ) }

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                        <DialogTitle>Создать товар</DialogTitle>
                        <DialogDescription>
                            Заполните данные о вашем товаре и загрузите фотографию.
                        </DialogDescription>
                        </DialogHeader>

                        {/* Контент формы и превью выносим отдельно от DialogHeader */}
                        <div className="flex flex-col gap-4 py-2">
                        <div className="relative flex h-48 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-zinc-800 p-4">
                            {previewUrl ? (
                            <>
                                <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-full w-full object-cover"
                                />
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 h-7 w-7 rounded-full bg-black/60 text-white hover:bg-black/80"
                                onClick={handleClearImage}
                                >
                                <X className="h-4 w-4" />
                                </Button>
                            </>
                            ) : (
                            <div className="flex flex-col items-center justify-center text-center">
                                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/60" />
                                <p className="text-sm text-muted-foreground">
                                    Choose image file below
                                </p>
                            </div>
                            )}
                        </div>
                        <form onSubmit={handleSubmit}>

                        <Tabs defaultValue="url" value={activeTab} onValueChange={(val) => setActiveTab(val as "file")}>

                            <TabsContent value="file" className="mt-2">
                            <p className="text-[13px] text-zinc-500 font-serif h-6">ЗАГРУЗИТЕ ФАЙЛ</p>
                            <Input 
                                className="h-10 py-2"
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                const selectedFile = e.target.files?.[0];
                                if (selectedFile){
                                    setFile(selectedFile);
                                    setPreviewUrl(URL.createObjectURL(selectedFile))
                                }
                                }} 
                            />
                            </TabsContent>
                        </Tabs>

                        {/* Название магазина */}
                        <Field className="mt-5 text-zinc-500 font-serif">
                            <FieldLabel className="text-[13px]">НАЗВАНИЕ ТОВАРА</FieldLabel>
                            <Input placeholder="Например, Iphone 17 megamax" 
                            className="h-10"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)} />
                        </Field>

                        <Field className="mt-5 text-zinc-500 font-serif">
                            <FieldLabel className="text-[13px]">ОПИСАНИЕ ТОВАРА</FieldLabel>
                            <Input placeholder="Например, новый классный айфон" 
                            className="h-10"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)} />
                        </Field>

                        <Field className="mt-5 text-zinc-500 font-serif">
                            <FieldLabel className="text-[13px]">ЦЕНА</FieldLabel>
                            <Input
                                type="number"
                                min="0"
                                inputMode="decimal"
                                placeholder="0.00" 
                                className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)} />
                        </Field>

                        <Field className="mt-5 text-zinc-500 font-serif">
                            <FieldLabel className="text-[13px]">КОЛИЧЕСТВО</FieldLabel>
                            <Input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder="1" 
                                className="h-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)} />
                        </Field>
                            
                            <div className="flex items-center gap-3">
                                <p className="mt-4 text-zinc-500 font-serif">Товар на продажу?</p>
                                <Checkbox className="mt-5 text-zinc-500 font-serif h-8 w-8" checked={isActive} onCheckedChange={(checked) => setActive(Boolean(checked))}/>
                            </div>

                        <Button type="submit" className="w-full flex items-center justify-center gap-2 text-white h-10 rounded-xl bg-cyan-500 font-bold hover:bg-cyan-600 mt-5">
                            <PackagePlus/>
                            Опубликовать товар
                        </Button>
                        </form>
                        </div>
                    </DialogContent>
                </Dialog>
        </div>
    )
}