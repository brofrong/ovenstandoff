import { useState, useEffect, useRef, useCallback } from "react";
import { env } from "@/lib/env";
import { wsContract, type Runner } from "@ovenstandoff/contract";
import { createClientSocket } from "@ovenstandoff/type-safe-socket";

interface UseWebSocketOptions {
  serverKey: string;
  onConnectionChange?: (connected: boolean) => void;
}

type Socket = ReturnType<typeof createClientSocket<typeof wsContract, unknown>>;

export function useWebSocket({
  serverKey,
  onConnectionChange
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!serverKey) return;

    try {
      // Подключаемся к WebSocket серверу на порту 3001 с аутентификацией
      const ws = new WebSocket(`${env.BUN_PUBLIC_WS_HOST}/ws?auth=${serverKey}&view=true`);
      let localSocket: Socket | null = null;

      ws.onopen = () => {
        console.log("WebSocket connected");
        const newSocket = createClientSocket(wsContract, ws);
        localSocket = newSocket;
        setSocket(newSocket);
        setIsConnected(true);
        setError(null);

        localSocket.on.updateRunners((data) => {
          setRunners(data.runners);
        });

        localSocket.request.registerView({ view: true }).then((ret) => {
          if (ret.success) {
            console.log("Runners:", ret.data.runners);
            setRunners(ret.data.runners);
          } else {
            console.error(ret.error);
          }
        });

        reconnectAttempts.current = 0;
        onConnectionChange?.(true);

      };

      ws.onmessage = (event) => {
        const ret = localSocket?.newEvent(event.data);
        if (ret?.error) {
          console.error(ret.error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setRunners([]);
        setSocket(null);
        localSocket = null;
        onConnectionChange?.(false);

        // Попытка переподключения
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, delay);
        } else {
          setError("Не удалось подключиться к серверу после нескольких попыток");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Ошибка подключения к серверу");
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Error creating WebSocket:", err);
      setError("Ошибка создания подключения");
    }
  }, [serverKey, setRunners, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setRunners([]);
    setError(null);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (serverKey) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [serverKey, connect, disconnect]);

  return {
    isConnected,
    runners,
    error,
    socket,
    sendMessage,
    reconnect: connect,
    disconnect
  };
}
