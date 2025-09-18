# API Setup Guide

## 🚀 Настройка API для WAY Esports

### Переменные окружения

Создайте файл `.env` в корневой папке frontend с следующими переменными:

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=WAY Esports
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
```

### Альтернативные способы настройки

Если вы не можете создать файл `.env`, вы можете настроить API URL одним из следующих способов:

#### 1. Через window объект
Добавьте в `index.html`:
```html
<script>
  window.__API_URL__ = 'http://localhost:3001';
</script>
```

#### 2. Через переменные окружения системы
```bash
export VITE_API_URL=http://localhost:3001
```

#### 3. Через package.json scripts
```json
{
  "scripts": {
    "dev": "VITE_API_URL=http://localhost:3001 vite",
    "build": "VITE_API_URL=http://localhost:3001 vite build"
  }
}
```

### Проверка подключения

После настройки вы можете проверить подключение к API:

```typescript
import { checkApiHealth } from './src/config/api';

// Проверка здоровья API
const isHealthy = await checkApiHealth();
console.log('API Health:', isHealthy);
```

### Структура API

API использует следующие endpoints:

#### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы
- `POST /api/auth/refresh` - Обновление токена

#### Профиль
- `GET /api/profile` - Получение профиля
- `PUT /api/profile` - Обновление профиля
- `POST /api/profile/upload-logo` - Загрузка логотипа
- `GET /api/profile/achievements` - Получение достижений
- `POST /api/profile/achievements` - Добавление достижения

#### Турниры
- `GET /api/tournaments` - Список турниров
- `GET /api/tournaments/:id` - Детали турнира
- `POST /api/tournaments/:id/join` - Присоединение к турниру

#### Команды
- `GET /api/teams` - Список команд
- `GET /api/teams/:id` - Детали команды
- `POST /api/teams` - Создание команды

#### Кошелек
- `GET /api/wallet/balance` - Баланс кошелька
- `POST /api/wallet/withdraw` - Вывод средств
- `GET /api/wallet/transactions` - История транзакций

### Отладка

Для отладки API запросов включите логирование в консоли браузера. Все запросы логируются с базовым URL.

### Безопасность

- Все API запросы используют HTTPS в продакшене
- Заголовки CORS настроены на бэкенде
- Аутентификация через JWT токены

### Troubleshooting

#### Ошибка "process is not defined"
Эта ошибка возникает, когда код пытается использовать `process.env` в браузерной среде. Решение:

1. Используйте `import.meta.env` для Vite
2. Создайте файл `.env` с переменными `VITE_*`
3. Используйте fallback значения

#### Ошибка CORS
Если возникают ошибки CORS:

1. Убедитесь, что бэкенд запущен
2. Проверьте настройки CORS на бэкенде
3. Убедитесь, что URL API корректный

#### Ошибка "Network Error"
Если API недоступен:

1. Проверьте, что бэкенд запущен на правильном порту
2. Проверьте URL в переменных окружения
3. Проверьте сетевые настройки

### Примеры использования

```typescript
import apiService from './src/services/api';

// Получение профиля
const profile = await apiService.getUserProfile();

// Обновление профиля
await apiService.updateProfile({ username: 'newUsername' });

// Получение турниров
const tournaments = await apiService.getTournaments();
``` 