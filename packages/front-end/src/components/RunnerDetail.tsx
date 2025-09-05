import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Square, Monitor, Settings } from "lucide-react";
import type { Runner } from "@ovenstandoff/contract";
import { AllStates } from "@ovenstandoff/contract";
import { useWebSocket } from "@/hooks/useWebSocket";

interface RunnerDetailProps {
  runner: Runner;
  onBack: () => void;
  serverKey: string;
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

const stateOptions: { value: typeof AllStates[number]; label: string }[] = [
  { value: "booting", label: "Загрузка" },
  { value: "android", label: "Android режим" },
  { value: "launching", label: "Запуск игры" },
  { value: "readyForCreateLobby", label: "Готов к созданию лобби" },
  { value: "createLobby", label: "Создание лобби" },
  { value: "waitingForPlayers", label: "Ожидание игроков" },
  { value: "lowSettings", label: "Низкие настройки" },
  { value: "changeName", label: "Смена имени" },
  { value: "inGame", label: "В игре" },
  { value: "debug", label: "Отладка" },
];

export function RunnerDetail({ runner, onBack, serverKey }: RunnerDetailProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [isChangingState, setIsChangingState] = useState(false);
  const [newState, setNewState] = useState<typeof AllStates[number]>(runner.state);

  const { socket, sendMessage } = useWebSocket({
    serverKey,
  });

  useEffect(() => {
    if (socket) {
      // Listen for screen frames
      socket.on.screenFrame((data) => {
        if (data.runner === runner.name) {
          setCurrentFrame(data.frame);
        }
      });

      // Listen for state change responses
      socket.on.changeRunnerState((data) => {
        setIsChangingState(false);
        if (data.success) {
          console.log("State changed successfully");
        } else {
          console.error("Failed to change state:", data.message);
        }
      });
    }
  }, [socket, runner.name]);

  const handleStartStream = async () => {
    if (socket) {
      const result = await socket.request.startScreenStream({ runner: runner.name });
      if (result.success) {
        setIsStreaming(true);
        console.log("Screen stream started");
      } else {
        console.error("Failed to start stream:", result.error);
      }
    }
  };

  const handleStopStream = async () => {
    if (socket) {
      const result = await socket.request.stopScreenStream({ runner: runner.name });
      if (result.success) {
        setIsStreaming(false);
        setCurrentFrame(null);
        console.log("Screen stream stopped");
      } else {
        console.error("Failed to stop stream:", result.error);
      }
    }
  };

  const handleStateChange = async (newStateValue: typeof AllStates[number]) => {
    setNewState(newStateValue);
    setIsChangingState(true);

    if (socket) {
      const result = await socket.request.changeRunnerState({
        runner: runner.name,
        state: newStateValue,
      });

      if (result.success) {
        console.log("State changed successfully");
      } else {
        console.error("Failed to change state:", result.error);
        setIsChangingState(false);
      }
    }
  };

  const handleImageClick = async (event: React.MouseEvent<HTMLImageElement>) => {
    // Only allow clicks when runner is in debug state
    if (runner.state !== "debug") {
      console.log("Click ignored: Runner is not in debug state");
      return;
    }

    if (!socket) {
      console.error("Socket not available");
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert screen coordinates to phone coordinates
    // Assuming the image is scaled to fit the container
    const imageWidth = event.currentTarget.naturalWidth;
    const imageHeight = event.currentTarget.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    const scaleX = imageWidth / displayWidth;
    const scaleY = imageHeight / displayHeight;

    const phoneX = Math.round(x * scaleX);
    const phoneY = Math.round(y * scaleY);

    console.log(`Click at screen coordinates: (${x}, ${y}), phone coordinates: (${phoneX}, ${phoneY})`);

    try {
      const result = await socket.request.clickCommand({
        runner: runner.name,
        x: phoneX,
        y: phoneY,
      });

      if (result.success) {
        console.log("Click command sent successfully");
      } else {
        console.error("Failed to send click command:", result.error);
      }
    } catch (error) {
      console.error("Error sending click command:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="bg-card border-muted shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{runner.name}</h1>
            <div className={`w-4 h-4 rounded-full ${getStateColor(runner.state)}`} />
            <Badge variant="secondary">
              {getStateText(runner.state)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Screen Stream */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-muted shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Экран раннера
                  </CardTitle>
                  <div className="flex gap-2">
                    {!isStreaming ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartStream}
                        className="bg-card border-muted shadow-sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Начать стрим
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStopStream}
                        className="bg-card border-muted shadow-sm"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Остановить стрим
                      </Button>
                    )}
                  </div>
                </div>
                {runner.state === "debug" && currentFrame && (
                  <div className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium mt-2">
                    Режим отладки: кликните на экран
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                  {currentFrame ? (
                    <img
                      src={`data:image/png;base64,${currentFrame}`}
                      alt="Runner screen"
                      className={`max-w-full max-h-full object-contain rounded ${runner.state === "debug"
                        ? "cursor-crosshair hover:opacity-90 transition-opacity"
                        : "cursor-default"
                        }`}
                      onClick={handleImageClick}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Monitor className="h-12 w-12 mx-auto mb-2" />
                      <p>Нажмите "Начать стрим" для просмотра экрана</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* State Control */}
            <Card className="bg-card border-muted shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Управление состоянием
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Текущее состояние
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStateColor(runner.state)}`} />
                    <span className="text-sm">{getStateText(runner.state)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Изменить состояние
                  </label>
                  <Select
                    value={newState}
                    onValueChange={handleStateChange}
                    disabled={isChangingState}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите состояние" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isChangingState && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Изменение состояния...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Runner Info */}
            <Card className="bg-card border-muted shadow-sm">
              <CardHeader>
                <CardTitle>Информация о раннере</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {runner.matchID && (
                  <div>
                    <span className="text-sm text-muted-foreground">ID матча: </span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {runner.matchID}
                    </code>
                  </div>
                )}

                {runner.callbackUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">Callback URL: </span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono break-all">
                      {runner.callbackUrl}
                    </code>
                  </div>
                )}

                {runner.code && (
                  <div>
                    <span className="text-sm text-muted-foreground">Код: </span>
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {runner.code}
                    </code>
                  </div>
                )}

                {runner.team && (
                  <div>
                    <span className="text-sm text-muted-foreground">Команды: </span>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-blue-600">CT: </span>
                        <div className="text-xs mt-1">
                          {runner.team.ct.length > 0 ? (
                            runner.team.ct.map((player, index) => (
                              <span key={index} className="block">
                                {player}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Пусто</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-orange-600">T: </span>
                        <div className="text-xs mt-1">
                          {runner.team.t.length > 0 ? (
                            runner.team.t.map((player, index) => (
                              <span key={index} className="block">
                                {player}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">Пусто</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
