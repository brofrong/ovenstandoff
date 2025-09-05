# Oven Standoff - Настройка и запуск

## Описание

Система управления раннерами для Oven Standoff с веб-интерфейсом для мониторинга активных раннеров.

## Функциональность

- 🔐 Аутентификация по серверному ключу
- 🔌 WebSocket подключение к master-server
- 📊 Отображение активных раннеров в реальном времени
- 💾 Сохранение ключа в localStorage браузера
- 🔄 Автоматическое переподключение при разрыве связи

## Настройка окружения

### Master Server

Создайте файл `.env` в корне проекта со следующими переменными:

```env
CH_TOKEN=test_token
SECRET=test_secret_key
PORT=3000
WS_PORT=3001
EMAILS=admin@example.com
PASSWORDS=admin123
MOCK=0
```

## Запуск

### 1. Master Server (WebSocket на порту 3001)

```bash
cd packages/master-server
bun run start
```

### 2. Frontend (React приложение на порту 3000)

```bash
cd packages/front-end
bun run dev
```

## Использование

1. Откройте браузер и перейдите на `http://localhost:3000`
2. Введите серверный ключ (используйте значение `SECRET` из .env файла)
3. После успешной аутентификации вы увидите панель с активными раннерами
4. Список раннеров обновляется в реальном времени через WebSocket

## Структура проекта

```
packages/
├── front-end/          # React приложение
│   ├── src/
│   │   ├── components/ # UI компоненты
│   │   ├── hooks/      # React хуки
│   │   └── App.tsx     # Главный компонент
│   └── package.json
└── master-server/      # WebSocket сервер
    ├── src/
    │   ├── master-ws.ts    # WebSocket обработчики
    │   ├── services/       # Бизнес логика
    │   └── utils/          # Утилиты
    └── package.json
```

## Компоненты

### ServerKeyForm
Форма для ввода серверного ключа с валидацией и сохранением в localStorage.

### Dashboard
Главная панель с отображением:
- Статуса подключения к WebSocket
- Списка активных раннеров
- Информации о сервере
- Кнопок управления (переподключение, выход)

### RunnersList
Компонент для отображения раннеров с:
- Статусами (готов, в лобби, в игре, офлайн)
- Информацией о матчах
- Цветовой индикацией состояния

## WebSocket API

### Подключение
```
ws://localhost:3001/ws?auth=<SECRET_KEY>
```

### Сообщения от сервера
```json
{
  "type": "runners",
  "runners": [
    {
      "name": "runner-1",
      "state": "readyForCreateLobby",
      "matchID": null,
      "callbackUrl": null
    }
  ]
}
```

## Состояния раннеров

- `readyForCreateLobby` - Готов к созданию лобби (зеленый)
- `inLobby` - В лобби (синий)
- `inGame` - В игре (оранжевый)
- `offline` - Офлайн (серый)
