"use client"

import { useParams, useRouter } from "next/navigation"
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
import { ImageIcon, PackagePlus, X, ArrowLeft, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import api, { authApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type ProductIn = components['schemas']['ProductIn']
export type ProductOut = components['schemas']['ProductOut']

export default function Products() {
    const params = useParams();
    const router = useRouter();
    const shopId = params.shop_id;

    // Состояния создания товара
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

    // Состояние корзины
    const [cart, setCart] = useState<Array<{ product: ProductOut; quantity: number }>>([]);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

    const { data: shop, isLoading: isShopLoading } = useQuery({
        queryKey: ["shop", shopId],
        queryFn: () => authApi.get_shop_owner(shopId as string),
        enabled: Boolean(shopId)
    })

    const { data: product, isLoading: isProductsLoading } = useQuery({
        queryKey: ["products", shopId],
        queryFn: () => authApi.get_products(shopId as string),
        enabled: Boolean(shopId)
    })

    // Вспомогательные функции корзины
    const addToCart = (productItem: ProductOut) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === productItem.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === productItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product: productItem, quantity: 1 }];
        });
        toast.success(`Товар "${productItem.title}" добавлен в корзину`);
    };

    const updateQuantity = (productId: ProductOut['id'], delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.product.id === productId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean) as Array<{ product: ProductOut; quantity: number }>
        );
    };

    const removeFromCart = (productId: ProductOut['id']) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotalPrice = cart.reduce(
        (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
        0
    );

    const handleCheckout = () => {
        toast.success("Заказ оформлен!");
        setCart([]);
        setIsCartOpen(false);
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !description.trim() || !price || !stock || !file){
            toast.warning("Заполните все поля и загрузите фотографию")
            return;
        }
        
        const formData = new FormData();
        formData.append("title", title) 
        formData.append("description", description)
        formData.append("price", price)
        formData.append("stock", stock)
        formData.append("is_active", String(isActive)) 
        formData.append("image", file) 
        
        await api.post(`shops/${shopId}/product`, formData, {
            headers: {
                'Content-Type': undefined
            }
        })
        toast.success("Товар успешно опубликован!")

        setIsOpen(false);
        setTitle("");
        setDescription("");
        setPrice("");
        setStock("1");
        setActive(true);
        setFile(null);
        setPreviewUrl(null);
    }

    if (isShopLoading || isProductsLoading) {
        return (
            <div className="w-full px-4 pt-4 font-mono">
                <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-800" />
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
                            <div className="aspect-square w-full animate-pulse rounded-xl bg-zinc-800" />
                            <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
                            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-800/70" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative flex flex-col items-center justify-center text-center">
            {/* Шапка с кнопкой «Назад» */}
            <div className="w-full px-4 pt-2 flex items-center justify-start">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 font-mono text-xs px-3 py-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Назад
                </Button>
            </div>

            {product?.length === 0 ? (
                <>
                    {shop?.is_owner === true ? (
                        <>
                            <div className="mt-16 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-inner shadow-black/40">
                                <PackagePlus className="h-8 w-8 text-zinc-500" />
                            </div>
                            <div className="mt-6 flex flex-col items-center justify-center gap-3 px-2 font-mono">
                                <p className="text-xl font-bold text-zinc-100">Пока что товаров нет</p>
                                <p className="text-sm leading-relaxed text-zinc-500">
                                Создайте свой первый товар для вашего нового магазина.
                                </p>
                                <Button
                                className="mt-4 h-12 rounded-xl bg-cyan-500 px-8 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-600"
                                onClick={() => setIsOpen(true)}
                                >
                                + Создать товар 
                                </Button>
                            </div>                 
                        </> 
                    ) : (
                    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-2 p-6 text-center font-mono">
                        <PackagePlus className="mb-1 h-7 w-7 text-zinc-600" />
                        <p className="text-sm font-bold text-zinc-400">
                            Зайдите позже, владелец еще не добавил товары в этот магазин.
                        </p>
                    </div>
                    )}
                </>
             ) : (
                <div className="w-full px-4 pb-24 text-left font-mono mt-4">
                <h2 className="mb-4 border-b border-zinc-800 pb-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
                    Товары ({product?.length || 0})
                </h2>
                {/* Сетка товаров */}
                <div className="grid grid-cols-2 gap-4">
                    {product?.map((prodItem) => (
                    <div
                        key={prodItem.id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/30"
                    >
                        {/* Картинка товара */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-800">
                        <img
                            src={prodItem.image}
                            alt={prodItem.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        </div>
                        {/* Контент товара */}
                        <div className="mt-3 flex flex-col flex-1 justify-between">
                        <div>
                            <h3 className="truncate text-sm font-bold text-zinc-100">
                            {prodItem.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                            {prodItem.description}
                            </p>
                        </div>
                        {/* Цена, наличие и кнопка заказа */}
                        <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800/80 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-cyan-400">
                                {prodItem.price} ₽
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                {prodItem.is_active && prodItem.stock > 0
                                    ? `В остатке: ${prodItem.stock}`
                                    : "Нет в наличии"}
                                </span>
                            </div>

                            {/* Кнопка "В корзину" только для покупателей */}
                            {!shop?.is_owner && (
                                <Button
                                    disabled={!prodItem.is_active || prodItem.stock <= 0}
                                    onClick={() => addToCart(prodItem as ProductOut)}
                                    className="h-9 w-full rounded-lg bg-cyan-500 text-xs font-bold text-white shadow-md shadow-cyan-500/10 transition-colors hover:bg-cyan-600 disabled:opacity-50"
                                >
                                    В корзину
                                </Button>
                            )}
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                    <div>
                        {shop?.is_owner && (
                        <Button
                            className="absolute bottom-6 right-4 z-50 h-12 rounded-full bg-cyan-500 px-6 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-colors hover:bg-cyan-600"
                            onClick={() => setIsOpen(true)}
                            >
                            + Создать товар 
                        </Button>
                        )}
                    </div>
                </div>
            ) }

                {/* Плавающая плашка Корзины */}
                {cart.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                        <Button
                            onClick={() => setIsCartOpen(true)}
                            className="h-12 px-6 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold font-mono shadow-xl shadow-cyan-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            🛒 Корзина ({cartTotalCount}) — {cartTotalPrice} ₽
                        </Button>
                    </div>
                )}

                {/* Модалка/Drawer Корзины */}
                <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
                    <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 font-mono text-zinc-100">
                        <DialogHeader>
                            <DialogTitle className="text-zinc-100 flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-cyan-400" />
                                Корзина
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500">
                                Состав вашего заказа
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 my-2">
                            {cart.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                                >
                                    <img
                                        src={item.product.image}
                                        alt={item.product.title}
                                        className="h-12 w-12 rounded-lg object-cover bg-zinc-800"
                                    />
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-xs font-bold text-zinc-100 truncate">
                                            {item.product.title}
                                        </h4>
                                        <p className="text-xs text-cyan-400 font-bold mt-1">
                                            {item.product.price} ₽
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            onClick={() => updateQuantity(item.product.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-xs font-bold text-zinc-200 min-w-[16px] text-center">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            onClick={() => updateQuantity(item.product.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={() => removeFromCart(item.product.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-zinc-800 pt-4 mt-2 flex flex-col gap-4">
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span className="text-zinc-400">Итого:</span>
                                <span className="text-cyan-400 text-base">{cartTotalPrice} ₽</span>
                            </div>
                            <Button
                                onClick={handleCheckout}
                                className="h-12 w-full rounded-xl bg-cyan-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-colors"
                            >
                                Оформить заказ
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Модалка создания товара владельца */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 font-mono">
                        <DialogHeader>
                        <DialogTitle className="text-zinc-100">Создать товар</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Заполните данные о вашем товаре и загрузите фотографию.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-2 max-h-[75vh] overflow-y-auto pr-1">
                        <div className="relative flex h-40 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/60 p-4">
                            {previewUrl ? (
                            <>
                                <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-full w-full rounded-xl object-cover"
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
                            <div className="flex flex-col items-center justify-center gap-1 text-center">
                                <ImageIcon className="mb-1 h-7 w-7 text-zinc-600" />
                                <p className="text-xs text-zinc-500">
                                    Выберите файл ниже
                                </p>
                            </div>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col">
                        <Tabs defaultValue="url" value={activeTab} onValueChange={(val) => setActiveTab(val as "file")}>
                            <TabsContent value="file" className="mt-2">
                            <p className="h-6 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">Загрузите файл</p>
                            <Input 
                                className="h-11 p-1 file:mt-1 px-2 cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-cyan-600"
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
                        <Field className="mt-5">
                            <FieldLabel className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">Название товара</FieldLabel>
                            <Input placeholder="Например, Iphone 17 megamax" 
                            className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/50"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)} />
                        </Field>
                        <Field className="mt-4">
                            <FieldLabel className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">Описание товара</FieldLabel>
                            <Input placeholder="Например, новый классный айфон" 
                            className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/50"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)} />
                        </Field>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field>
                            <FieldLabel className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">Цена</FieldLabel>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="0"
                                    inputMode="decimal"
                                    placeholder="0.00" 
                                    className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 pl-7 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)} />
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₽</span>
                            </div>
                        </Field>
                        <Field>
                            <FieldLabel className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">Количество</FieldLabel>
                            <Input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder="1" 
                                className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)} />
                        </Field>
                        </div>
                            
                            <div className="mt-5 flex items-center gap-3">
                                <Checkbox 
                                    className="h-5 w-5 rounded-md border-zinc-700 bg-zinc-900/60 data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500" 
                                    checked={isActive} 
                                    onCheckedChange={(checked) => setActive(Boolean(checked))}
                                />
                                <p className="text-sm text-zinc-400">Товар на продажу?</p>
                            </div>
                        <Button type="submit" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-600">
                            <PackagePlus className="h-4 w-4"/>
                            Опубликовать товар
                        </Button>
                        </form>
                        </div>
                    </DialogContent>
                </Dialog>
        </div>
    )
}