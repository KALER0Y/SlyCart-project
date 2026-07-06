import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CustomerProfilePage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">

        {/* Заголовок профиля */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Профиль покупателя</h1>
          <Badge variant="secondary">Customer</Badge>
        </div>

        {/* Карточка с основной информацией */}
        <Card>
          <CardHeader>
            <CardTitle>Мои данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Имя: —</p>
            <p className="text-sm text-muted-foreground">Telegram ID: —</p>
          </CardContent>
        </Card>

        {/* Карточка с заказами (скелет, без реальных данных) */}
        <Card>
          <CardHeader>
            <CardTitle>Мои заказы</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Здесь будет список заказов
            </p>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full">
          Выйти
        </Button>

      </div>
    </div>
  );
}