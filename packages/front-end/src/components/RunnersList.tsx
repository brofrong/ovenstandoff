import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Gamepad2, Users, Smartphone, Play, Settings, User, Wifi, Bug, Eye } from "lucide-react";
import type { Runner } from '../../../contract/src/ws';
import { Badge } from "./ui/badge";

interface RunnersListProps {
  runners: Runner[];
  onRunnerSelect?: (runner: Runner) => void;
}

const getStateColor = (state: Runner["state"]) => {
  switch (state) {
    case "booting":
      return "bg-yellow-500";
    case "android":
      return "bg-purple-500";
    case "launching":
      return "bg-blue-500";
    case "readyForCreateLobby":
      return "bg-green-500";
    case "createLobby":
      return "bg-blue-600";
    case "waitingForPlayers":
      return "bg-orange-400";
    case "lowSettings":
      return "bg-yellow-600";
    case "changeName":
      return "bg-indigo-500";
    case "inGame":
      return "bg-red-500";
    case "debug":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const getStateText = (state: Runner["state"]) => {
  switch (state) {
    case "booting":
      return "Загрузка";
    case "android":
      return "Android режим";
    case "launching":
      return "Запуск игры";
    case "readyForCreateLobby":
      return "Готов к созданию лобби";
    case "createLobby":
      return "Создание лобби";
    case "waitingForPlayers":
      return "Ожидание игроков";
    case "lowSettings":
      return "Низкие настройки";
    case "changeName":
      return "Смена имени";
    case "inGame":
      return "В игре";
    case "debug":
      return "Отладка";
    default:
      return "Неизвестно";
  }
};

const getStateIcon = (state: Runner["state"]) => {
  switch (state) {
    case "booting":
      return <Clock className="h-4 w-4" />;
    case "android":
      return <Smartphone className="h-4 w-4" />;
    case "launching":
      return <Play className="h-4 w-4" />;
    case "readyForCreateLobby":
      return <Activity className="h-4 w-4" />;
    case "createLobby":
      return <Users className="h-4 w-4" />;
    case "waitingForPlayers":
      return <Users className="h-4 w-4" />;
    case "lowSettings":
      return <Settings className="h-4 w-4" />;
    case "changeName":
      return <User className="h-4 w-4" />;
    case "inGame":
      return <Gamepad2 className="h-4 w-4" />;
    case "debug":
      return <Bug className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function RunnersList({ runners, onRunnerSelect }: RunnersListProps) {
  const activeRunners = runners;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Активные раннеры</h2>
        <Badge variant="secondary" className="text-sm">
          {activeRunners.length} активных
        </Badge>
      </div>

      {activeRunners.length === 0 ? (
        <Card className="bg-card border-muted shadow-sm">
          <CardContent className="pt-6 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Нет активных раннеров
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeRunners.map((runner) => (
            <Card key={runner.name} className="bg-card border-muted shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header with name and state */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${getStateColor(runner.state)}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{runner.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getStateIcon(runner.state)}
                          <span>{getStateText(runner.state)}</span>
                        </div>
                      </div>
                    </div>

                    {onRunnerSelect && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRunnerSelect(runner)}
                        className="bg-card border-muted shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Открыть
                      </Button>
                    )}
                  </div>

                  {/* Match information */}
                  {runner.matchID && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Информация о матче</div>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">ID матча: </span>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                            {runner.matchID}
                          </code>
                        </div>
                        {runner.callbackUrl && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Callback URL: </span>
                            <code className="bg-background px-2 py-1 rounded text-xs font-mono break-all">
                              {runner.callbackUrl}
                            </code>
                          </div>
                        )}
                        {runner.code && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Код: </span>
                            <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                              {runner.code}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Team information */}
                  {runner.team && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Команды</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-blue-600 mb-1">CT (Контр-террористы)</div>
                          <div className="space-y-1">
                            {runner.team.ct.length > 0 ? (
                              runner.team.ct.map((player, index) => (
                                <div key={index} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                  {player}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">Нет игроков</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-orange-600 mb-1">T (Террористы)</div>
                          <div className="space-y-1">
                            {runner.team.t.length > 0 ? (
                              runner.team.t.map((player, index) => (
                                <div key={index} className="text-xs bg-orange-100 px-2 py-1 rounded">
                                  {player}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">Нет игроков</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
