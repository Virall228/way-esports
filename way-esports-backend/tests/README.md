# WAY-Esports Backend Testing Suite

Этот документ описывает систему тестирования для бэкенда WAY-Esports, включая оптимизации производительности и комплексные тесты.

## Структура тестов

```
tests/
├── models/                 # Unit тесты для моделей
│   ├── Tournament.test.ts  # Тесты модели турниров
│   └── Team.test.ts       # Тесты модели команд
├── e2e/                   # End-to-end тесты
│   └── tournament-flow.test.ts  # Полный жизненный цикл турнира
├── integration/           # Интеграционные тесты API
│   └── tournament-api.test.ts   # Тесты API турниров
├── performance/           # Performance тесты
│   └── tournament-performance.test.ts  # Тесты производительности
├── utils/                 # Утилиты для тестирования
│   └── test-helpers.ts    # Вспомогательные функции
├── setup.ts              # Настройка тестовой среды
└── README.md             # Этот файл
```

## Установка зависимостей

```bash
npm install
```

Основные зависимости для тестирования:
- `jest` - Фреймворк для тестирования
- `ts-jest` - TypeScript поддержка для Jest
- `mongodb-memory-server` - In-memory MongoDB для тестов
- `supertest` - HTTP тестирование
- `@types/jest` - TypeScript типы для Jest
- `@types/supertest` - TypeScript типы для Supertest

## Запуск тестов

### Все тесты
```bash
npm test
```

### Unit тесты (модели)
```bash
npm run test:unit
```

### End-to-end тесты
```bash
npm run test:e2e
```

### Performance тесты
```bash
npm run test:performance
```

### Тесты с покрытием кода
```bash
npm run test:coverage
```

### Режим наблюдения (watch mode)
```bash
npm run test:watch
```

## Типы тестов

### 1. Unit тесты (models/)

Тестируют отдельные модели и их методы:

- **Tournament.test.ts**: 
  - Создание турниров
  - Валидация данных
  - Регистрация команд
  - Генерация турнирной сетки
  - Управление статусами
  - Performance тесты для больших турниров

- **Team.test.ts**:
  - Создание команд
  - Управление игроками
  - Статистика команд
  - Валидация ограничений

### 2. End-to-End тесты (e2e/)

Тестируют полный жизненный цикл турнира:

- Создание турнира
- Регистрация команд
- Запуск турнира
- Проведение матчей
- Завершение турнира
- Обработка больших турниров (64+ команд)

### 3. Integration тесты (integration/)

Тестируют API endpoints:

- CRUD операции для турниров
- Пагинация и фильтрация
- Регистрация команд
- Обновление результатов матчей
- Обработка ошибок
- Concurrent операции

### 4. Performance тесты (performance/)

Тестируют производительность системы:

- Создание большого количества турниров
- Массовые запросы к базе данных
- Генерация турнирных сеток для больших турниров
- Использование памяти
- Concurrent операции

## Оптимизации производительности

### 1. Индексы базы данных

Добавлены составные индексы для оптимизации запросов:

```javascript
// Основные индексы
TournamentSchema.index({ status: 1, startDate: -1 });
TournamentSchema.index({ game: 1, status: 1, startDate: -1 });
TournamentSchema.index({ isActive: 1, status: 1, startDate: -1 });
TournamentSchema.index({ createdBy: 1, createdAt: -1 });
```

### 2. Пагинация

Все списки турниров поддерживают пагинацию:

```javascript
GET /api/tournaments?page=1&limit=10&game=CS:GO&status=registration
```

### 3. Агрегация MongoDB

Использование aggregation pipeline для сложных запросов:

```javascript
const tournaments = await Tournament.aggregate([
  { $match: filter },
  { $sort: { startDate: -1 } },
  { $skip: skip },
  { $limit: limit },
  { $lookup: { /* populate teams */ } }
]);
```

### 4. Оптимизированная генерация турнирной сетки

- Fisher-Yates алгоритм для перемешивания команд
- Эффективная обработка bye-матчей
- Оптимизация для турниров 64+ команд

## Метрики производительности

Тесты измеряют следующие метрики:

- **Время создания турнира**: < 1 секунды
- **Время запроса списка турниров**: < 500ms
- **Время генерации турнирной сетки**:
  - 8 команд: < 100ms
  - 16 команд: < 200ms
  - 32 команды: < 500ms
  - 64 команды: < 1 секунды
- **Время регистрации команды**: < 500ms
- **Concurrent запросы**: 50 запросов < 5 секунд

## Использование тестовых утилит

### TestDataFactory

Создание тестовых данных:

```typescript
import { TestDataFactory } from '../utils/test-helpers';

// Создать пользователя
const user = await TestDataFactory.createUser({ role: 'admin' });

// Создать команду
const team = await TestDataFactory.createTeam(captain);

// Создать турнир с командами
const { tournament, teams } = await TestDataFactory.createTournamentWithTeams(admin, 8);
```

### PerformanceMonitor

Измерение производительности:

```typescript
import { PerformanceMonitor } from '../utils/test-helpers';

const monitor = new PerformanceMonitor();
monitor.start();
// ... выполнить операцию
const duration = monitor.end('operation-name');
monitor.logStats('operation-name');
```

## Конфигурация Jest

Основные настройки в `jest.config.js`:

- TypeScript поддержка через `ts-jest`
- In-memory MongoDB через `mongodb-memory-server`
- Автоматическая очистка данных между тестами
- Покрытие кода для моделей, роутов и middleware
- Timeout 30 секунд для длительных тестов

## Continuous Integration

Для CI/CD рекомендуется:

```bash
# Запуск всех тестов с покрытием
npm run test:coverage

# Только быстрые тесты (без performance)
npm run test:unit && npm run test:e2e
```

## Отладка тестов

### Запуск отдельного теста
```bash
npx jest Tournament.test.ts
```

### Запуск с подробным выводом
```bash
npx jest --verbose
```

### Отладка в VS Code
Добавьте конфигурацию в `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Лучшие практики

1. **Изоляция тестов**: Каждый тест должен быть независимым
2. **Очистка данных**: Используйте `afterEach` для очистки тестовых данных
3. **Мокирование**: Мокайте внешние зависимости (auth middleware, внешние API)
4. **Performance тесты**: Устанавливайте разумные лимиты времени выполнения
5. **Покрытие кода**: Стремитесь к покрытию > 80%

## Troubleshooting

### Проблемы с MongoDB Memory Server
```bash
# Очистить кэш
npm run test -- --clearCache

# Увеличить timeout
jest.setTimeout(60000);
```

### Проблемы с памятью
```bash
# Запуск тестов последовательно
npm run test -- --runInBand

# Ограничение workers
npm run test -- --maxWorkers=2
```

### Проблемы с TypeScript
```bash
# Проверить компиляцию
npx tsc --noEmit

# Очистить dist
rm -rf dist && npm run build
```