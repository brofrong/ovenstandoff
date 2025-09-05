import { RunnersList } from "@/components/RunnersList";
import { RunnerDetail } from "@/components/RunnerDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { LogOut, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useCallback, useState } from "react";
import type { Runner } from "@ovenstandoff/contract";
import { env } from "@/lib/env";

interface DashboardProps {
  serverKey: string;
  onLogout: () => void;
}

export function Dashboard({ serverKey, onLogout }: DashboardProps) {
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);

  const onConnectionChange = useCallback((connected: boolean) => {
    console.log("Connection status changed:", connected);
  }, []);

  const {
    isConnected,
    runners,
    error,
    reconnect,
    disconnect
  } = useWebSocket({
    serverKey,
    onConnectionChange: onConnectionChange,
  });



  const handleLogout = () => {
    localStorage.removeItem("serverKey");
    disconnect();
    onLogout();
  };

  const handleReconnect = () => {
    reconnect();
  };

  const handleRunnerSelect = (runner: Runner) => {
    setSelectedRunner(runner);
  };

  const handleBackToList = () => {
    setSelectedRunner(null);
  };

  // If a runner is selected, show the detail view
  if (selectedRunner) {
    return (
      <RunnerDetail
        runner={selectedRunner}
        onBack={handleBackToList}
        serverKey={serverKey}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-foreground">Oven Standoff</h1>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <Badge variant="default" className="bg-green-500">
                    Подключено
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <Badge variant="destructive">
                    Отключено
                  </Badge>
                </>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-lg">Панель управления раннерами</p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 bg-red-500/10 backdrop-blur-sm border-red-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-400">
                <WifiOff className="h-4 w-4" />
                <span className="font-medium">Ошибка подключения:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Runners List */}
        <RunnersList runners={runners} onRunnerSelect={handleRunnerSelect} />

        {/* Server Info */}
        <Card className="mt-8 bg-card border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Информация о сервере</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>WebSocket:{env.BUN_PUBLIC_WS_HOST}/ws</div>
              <div>Статус: {isConnected ? "Активен" : "Неактивен"}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
                disabled={isConnected}
                className="bg-card border-muted shadow-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Переподключить
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-card border-muted shadow-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
