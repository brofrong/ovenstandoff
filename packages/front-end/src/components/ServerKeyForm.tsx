import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServerKeyFormProps {
  onKeySubmit: (key: string) => void;
}

export function ServerKeyForm({ onKeySubmit }: ServerKeyFormProps) {
  const [key, setKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsLoading(true);
    try {
      // Сохраняем ключ в localStorage
      localStorage.setItem("serverKey", key.trim());
      onKeySubmit(key.trim());
    } catch (error) {
      console.error("Error saving server key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-muted shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Oven Standoff</CardTitle>
          <p className="text-muted-foreground">
            Введите серверный ключ для подключения
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverKey">Серверный ключ</Label>
              <Input
                id="serverKey"
                type="password"
                placeholder="Введите ваш серверный ключ"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!key.trim() || isLoading}
            >
              {isLoading ? "Подключение..." : "Подключиться"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
