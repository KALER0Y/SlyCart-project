"use client";

import { useState } from "react";
import { Store, ImageIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ShopInterface() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

// Временные состояния для демонстрации работы превью
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"file" | "url">("url");

  const handleClearImage = () => {
  setPreviewUrl(null);
  };

return (
  <div className="flex flex-col items-center justify-center text-center">
    <p className="flex h-9 w-full items-center justify-center border-b border-neutral-600 font-mono text-xl font-bold">
    Мои магазины
    </p>
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
                  {activeTab === "url"
                    ? "Paste image URL below"
                    : "Choose image file below"}
                </p>
              </div>
            )}
          </div>

          {/* ЗДЕСЬ БУДУТ ПОЛЯ ВВОДА (Form / Input / Tabs) */}
          <div>
              <p>STORE NAME</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  );
}