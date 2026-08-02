"use client";

import { useState } from "react";
import { Store, ImageIcon, X } from "lucide-react";
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

import { useQuery } from '@tanstack/react-query';

import api from "@/lib/api"

import { authApi } from "@/lib/api";
import Link from "next/link";

export default function ShopInterface() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

// Временные состояния для демонстрации работы превью
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"file">("file");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleClearImage = () => {
  setPreviewUrl(null);
  };

  const { data } = useQuery({
    queryKey: ['myshops'],
    queryFn: authApi.get_shops
  });


  
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault(); // Чтобы не перезагружать страницу
    
    // 1. Проверяем, а не пустые ли данные?
    
    if (!name.trim() || !description.trim() || !file){
      toast.warning("Заполните все поля и загрузите фотографию")
      return;
    }
    
    // 2. Если все нормально, то собираем файлы
    const formData = new FormData();
    
    formData.append("name", name) 
    formData.append("description", description) 
    formData.append("logo_file", file) 

    // 3. Отправляем файлы
    
    await api.post('shop/', formData, {
      headers: {
        'Content-Type': undefined
      }
    })

    toast.success("Магазин успешно создан!")

    // 4. Очищаем модалку и сбрасываем формы
    setIsOpen(false); // Закрываем модалку
    setName("");       // Очищаем форму
    setDescription("");
    setFile(null);
    setPreviewUrl(null);

  }

  if (!data) {
    return <div>Ошибка</div>;
  }


  return (
    <div className="flex flex-col items-center justify-center text-center">
      
      {data?.length === 0 ? (
        <>
          <div className="mt-20 flex h-20 w-20 items-center justify-center gap-8 rounded-2xl border border-zinc-800 bg-zinc-900">
            <Store className="h-8 w-8 text-zinc-400" />
          </div>

          <div className="mt-4 flex flex-col items-center justify-center gap-4 font-mono">
            <p className="text-2xl font-bold">Пока что магазинов нет</p>
            <p className="text-[18px] text-gray-500">
              Создайте свой первый магазин и начните продавать тысячам пользователей Telegram.
            </p>

            <Button
              className="mt-3 rounded-[15px] bg-cyan-500 px-10 py-6 text-[18px] text-white font-bold hover:bg-cyan-600"
              onClick={() => setIsOpen(true)}
            >
              + Создать магазин
            </Button>
          </div>
        </>
      ) : 
      (
      <div>
          <div className="w-full px-4 text-left font-mono">
            <h2 className="mb-4 mt-4 border-b border-zinc-800 pb-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
              Мои магазины ({data.length})
            </h2>

            {/* Сетка карточек */}
            <div className="grid grid-cols-2 gap-4">
              {data.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shops/${shop.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                >
                  {/* Контейнер картинки */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-800">
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Инфо о магазине */}
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
          </div>
          <div>
            <Button
              className="absolute bottom-6 right-3 z-50 h-12 rounded-full bg-cyan-500 text-white font-bold shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              + Создать магазин
            </Button>
          </div>
      </div>
      )
    }
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать магазин</DialogTitle>
          <DialogDescription>
            Заполните данные о вашем магазине и загрузите логотип.
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
            <FieldLabel className="text-[13px]">НАЗВАНИЕ МАГАЗИНА</FieldLabel>
            <Input placeholder="Например, Dark Store" 
            className="h-10"
            value={name}
            onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field className="mt-5 text-zinc-500 font-serif">
            <FieldLabel className="text-[13px]">ОПИСАНИЕ МАГАЗИНА</FieldLabel>
            <Input placeholder="Например, магазин цифровой техники" 
            className="h-10"
            value={description}
            onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <Button type="submit" className="w-full flex items-center justify-center gap-2 text-white h-10 rounded-xl bg-cyan-500 font-bold hover:bg-cyan-600 mt-5">
            <Store/>
            Создать магазин
          </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}