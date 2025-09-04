# type-safe-socket

Библиотека для создания типизированных WebSocket соединений с полной поддержкой TypeScript и Zod валидации. Вдохновлена TS-Rest и предоставляет безопасный способ общения между клиентом и сервером.

## 🚀 Особенности

- **Полная типизация** - все события и данные полностью типизированы
- **Zod валидация** - автоматическая валидация входящих и исходящих данных
- **Request/Response API** - поддержка асинхронных запросов с ответами
- **Event-driven архитектура** - удобные методы для работы с событиями
- **Контрактный подход** - четкое определение API через контракты
- **Легкая интеграция** - работает с любыми WebSocket-совместимыми транспортами

## 📦 Установка

```bash
npm install @molvis/type-safe-socket
# или
yarn add @molvis/type-safe-socket
# или
pnpm add @molvis/type-safe-socket
```

## 📖 Быстрый старт

### 1. Создание контракта

Сначала определите контракт - схему событий для вашего приложения:

```typescript
import { createContract } from '@molvis/type-safe-socket';
import { z } from 'zod';

export const chatContract = createContract({
  // Событие только от сервера к клиенту
  userJoined: {
    server: z.object({
      userId: z.string(),
      username: z.string(),
      timestamp: z.number(),
    }),
  },
  
  // Событие в обе стороны
  message: {
    server: z.object({
      id: z.string(),
      text: z.string(),
      userId: z.string(),
      timestamp: z.number(),
    }),
    client: z.object({
      text: z.string(),
    }),
  },
  
  // Событие только от клиента к серверу
  typing: {
    client: z.object({
      isTyping: z.boolean(),
    }),
  },
});
```

### 2. Создание клиента

```typescript
import { createClientSocket } from '@molvis/type-safe-socket';

// Создаем WebSocket соединение
const ws = new WebSocket('ws://localhost:8080');

// Создаем типизированный клиент
const client = createClientSocket(chatContract, ws);

// Слушаем события от сервера
client.on.userJoined((data) => {
  console.log(`Пользователь ${data.username} присоединился`);
});

client.on.message((data) => {
  console.log(`Новое сообщение: ${data.text}`);
});

// Отправляем события на сервер
client.send.message({ text: 'Привет, мир!' });
client.send.typing({ isTyping: true });
```

### 3. Создание сервера

```typescript
import { createServerSocket } from '@molvis/type-safe-socket';

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  // Создаем типизированный сервер
  const server = createServerSocket(chatContract, ws);
  
  // Слушаем события от клиента
  server.on.message((data) => {
    console.log(`Получено сообщение: ${data.text}`);
    
    // Отправляем ответ всем клиентам
    server.send.message({
      id: generateId(),
      text: data.text,
      userId: 'user123',
      timestamp: Date.now(),
    });
  });
  
  server.on.typing((data) => {
    console.log(`Пользователь печатает: ${data.isTyping}`);
  });
});
```

## 🔄 Request/Response API

Библиотека поддерживает асинхронные запросы с ответами:

```typescript
// На сервере - обработчик запросов
server.requestHandler.getUserProfile((data, accept, reject) => {
  const user = findUser(data.userId);
  
  if (!user) {
    reject('Пользователь не найден');
    return;
  }
  
  accept({
    id: user.id,
    name: user.name,
    email: user.email,
  });
});

// На клиенте - отправка запроса
async function getUserProfile(userId: string) {
  const result = await client.request.getUserProfile({ userId });
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}
```


### Методы SocketInstance

#### События (Events)

```typescript
// Слушать события
socket.on.eventName((data) => {
  // Обработка события
});

// Слушать событие один раз
socket.once.eventName((data) => {
  // Обработка события (только один раз)
}).then((data) => {
  // Promise разрешается при получении события
});

// Отправка событий
socket.send.eventName(data);
```

#### Запросы (Requests)

```typescript
// Обработчик запросов (только на сервере)
socket.requestHandler.eventName((data, accept, reject) => {
  // Обработка запроса
  // Обязательно вызвать accept() или reject()
  accept(responseData);
  // или
  reject(errorMessage);
});

// Отправка запроса
const result = await socket.request.eventName(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### Утилиты

```typescript
// Получить контекст
const context = socket.context;

// Закрыть соединение
socket.close();

// Обработать новое событие (внутреннее использование)
socket.newEvent(jsonString);
```

## 🔧 Типы

### WSLike

```typescript
interface WSLike {
  send: (data: string) => void;
  close: () => void;
}
```

### Contract

```typescript
interface EventSchema {
  client?: z.ZodTypeAny;
  server?: z.ZodTypeAny;
}

interface Contract {
  [key: string]: EventSchema;
}
```

## 🧪 Тестирование

```bash
# Запуск тестов
pnpm test

# Запуск тестов в watch режиме
pnpm test --watch
```

## 📝 Примеры

### Чат приложение

```typescript
// contract.ts
export const chatContract = createContract({
  join: {
    client: z.object({ username: z.string() }),
    server: z.object({ success: z.boolean(), message: z.string() }),
  },
  message: {
    client: z.object({ text: z.string() }),
    server: z.object({ 
      id: z.string(), 
      text: z.string(), 
      username: z.string(),
      timestamp: z.number() 
    }),
  },
  leave: {
    client: z.object({}),
    server: z.object({ username: z.string() }),
  },
});

// client.ts
const client = createClientSocket(chatContract, ws);

client.on.message((data) => {
  console.log(`${data.username}: ${data.text}`);
});

client.on.leave((data) => {
  console.log(`${data.username} покинул чат`);
});

// Отправка сообщения
client.send.message({ text: 'Привет!' });
```

### Игровой сервер

```typescript
// contract.ts
export const gameContract = createContract({
  move: {
    client: z.object({ 
      x: z.number(), 
      y: z.number() 
    }),
    server: z.object({ 
      playerId: z.string(), 
      x: z.number(), 
      y: z.number() 
    }),
  },
  getPlayerStats: {
    client: z.object({ playerId: z.string() }),
    server: z.object({ 
      level: z.number(), 
      score: z.number() 
    }),
  },
});

// server.ts
const server = createServerSocket(gameContract, ws);

server.requestHandler.getPlayerStats((data, accept, reject) => {
  const stats = getPlayerStats(data.playerId);
  if (stats) {
    accept(stats);
  } else {
    reject('Игрок не найден');
  }
});
```

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 🙏 Благодарности

- Вдохновлено [TS-Rest](https://ts-rest.com/)
- Построено на [Zod](https://zod.dev/) для валидации
- Использует [UUID](https://www.npmjs.com/package/uuid) для генерации уникальных идентификаторов
