import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreSettingsForm } from "./_components/StoreSettingsForm";

export default function OwnerProfilePage() {
  return (
    <div className="container max-w-5xl py-10 px-4 mx-auto space-y-8">
      {/* Шапка профиля */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Панель владельца</h1>
          <p className="text-muted-foreground text-sm">
            Управление торговой точкой, тарифными лимитами и доступом команды.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Магазин активен
          </Badge>
        </div>
      </div>

      {/* Сетка с контентом */}
      <div className="grid gap-8 md:grid-cols-3">
        
        {/* Левая колонка: Основные настройки */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Настройки магазина</CardTitle>
              <CardDescription>
                Публичная информация вашей компании, которая отображается клиентам.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StoreSettingsForm />
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка: Статус подписки и лимиты */}
        <div className="space-y-6">
          <Card className="shadow-sm border-amber-500/20 bg-amber-500/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Тариф «Бизнес»</CardTitle>
                <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">
                  Pro
                </Badge>
              </div>
              <CardDescription>Следующее списание: 12.07.2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Загружено товаров</span>
                  <span className="font-medium text-foreground">42 / 100</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[42%]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Сотрудники</span>
                  <span className="font-medium text-foreground">3 / 5</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[60%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
