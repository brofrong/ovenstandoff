import { useState, useEffect } from "react";
import { ServerKeyForm } from "@/components/ServerKeyForm";
import { Dashboard } from "@/components/Dashboard";
import "./index.css";

export function App() {
  const [serverKey, setServerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем, есть ли сохраненный ключ в localStorage
    const savedKey = localStorage.getItem("serverKey");
    if (savedKey) {
      setServerKey(savedKey);
    }
    setIsLoading(false);
  }, []);

  const handleKeySubmit = (key: string) => {
    setServerKey(key);
  };

  const handleLogout = () => {
    setServerKey(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!serverKey) {
    return <ServerKeyForm onKeySubmit={handleKeySubmit} />;
  }

  return <Dashboard serverKey={serverKey} onLogout={handleLogout} />;
}

export default App;
