"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function StoreSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "Epic Market",
    slug: "epic-market",
    phone: "+7 (999) 123-45-67",
    email: "owner@epicmarket.ru"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Отправка на сервер:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    setIsLoading(false);
    alert("Данные успешно обновлены!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Сетка полей 2х2 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="storeName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Название магазина
          </Label>
          <Input
            id="storeName"
            value={formData.storeName}
            onChange={handleChange}
            placeholder="Введите название"
            required
            disabled={isLoading}
            className="focus-visible:ring-amber-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ссылка (Slug)
          </Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs text-muted-foreground select-none">
              mysite.ru/
            </span>
            <Input
              id="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="link"
              required
              disabled={isLoading}
              className="pl-[72px] focus-visible:ring-amber-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Телефон поддержки
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+7..."
            disabled={isLoading}
            className="focus-visible:ring-amber-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email для уведомлений
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="mail@example.com"
            required
            disabled={isLoading}
            className="focus-visible:ring-amber-500"
          />
        </div>
      </div>

      {/* Кнопка отправки */}
      <div className="flex justify-end border-t pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors px-6"
        >
          {isLoading ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>

    </form>
  );
}
