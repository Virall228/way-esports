# Поддержка соло игроков в турнирах

## Обзор изменений

Система турниров была расширена для поддержки не только командных турниров, но и индивидуальных (соло) турниров, а также смешанных турниров.

## Основные изменения

### 1. Модель Tournament

**Новые поля:**
- `type: 'team' | 'solo' | 'mixed'` - тип турнира
- `maxPlayers?: number` - максимальное количество соло игроков
- `registeredPlayers: ObjectId[]` - массив зарегистрированных соло игроков

**Обновленные методы:**
- `isRegistrationOpen()` - учитывает тип турнира и лимиты
- `canStart()` - проверяет общее количество участников
- `generateBracket()` - работает с командами и соло игроками

### 2. Модель Match

**Новые поля:**
- `player1?: ObjectId` - первый соло игрок
- `player2?: ObjectId` - второй соло игрок  
- `winnerType?: 'team' | 'player'` - тип победителя

### 3. API Endpoints

**Новые роуты:**
- `POST /api/tournaments/:id/register-player` - регистрация соло игрока
- `POST /api/tournaments/:id/register-team` - регистрация команды
- `GET /api/tournaments/:id/registration-status` - статус регистрации пользователя
- `DELETE /api/tournaments/:id/unregister` - отмена регистрации

**Обновленные роуты:**
- `POST /api/tournaments` - поддержка новых полей (type, maxPlayers)
- `GET /api/tournaments` - фильтрация по типу турнира
- `PUT /api/tournaments/:id/matches/:matchId` - обновление с winnerType

### 4. Middleware

**Новые middleware:**
- `canManageTournament` - проверка прав управления турниром
- `canRegisterForTournament` - проверка возможности регистрации
- `canRegisterTeam` - проверка прав регистрации команды
- `validateTournamentData` - валидация данных турнира
- `checkTournamentCapacity` - проверка заполненности турнира
- `preventDuplicateRegistration` - предотвращение дублирования

## Типы турниров

### 1. Командный турнир (team)
```json
{
  "type": "team",
  "maxTeams": 16,
  "registeredTeams": ["teamId1", "teamId2"]
}
```

### 2. Соло турнир (solo)
```json
{
  "type": "solo", 
  "maxPlayers": 32,
  "registeredPlayers": ["playerId1", "playerId2"]
}
```

### 3. Смешанный турнир (mixed)
```json
{
  "type": "mixed",
  "maxTeams": 8,
  "maxPlayers": 16,
  "registeredTeams": ["teamId1"],
  "registeredPlayers": ["playerId1", "playerId2"]
}
```

## Использование API

### Создание соло турнира
```javascript
POST /api/tournaments
{
  "name": "Solo Championship",
  "type": "solo",
  "maxPlayers": 32,
  "game": "CS:GO",
  // ... другие поля
}
```

### Регистрация соло игрока
```javascript
POST /api/tournaments/:id/register-player
// Тело запроса пустое - используется ID из токена
```

### Проверка статуса регистрации
```javascript
GET /api/tournaments/:id/registration-status
// Возвращает информацию о возможности регистрации
```

## Турнирная сетка

Система автоматически создает турнирную сетку, объединяя команды и соло игроков как участников. В матчах могут встречаться:
- Команда vs Команда
- Игрок vs Игрок  
- Команда vs Игрок (в смешанных турнирах)

## Безопасность

- Валидация типов турниров и лимитов участников
- Проверка прав доступа для управления турнирами
- Предотвращение дублирования регистраций
- Rate limiting для операций с турнирами

## Производительность

- Оптимизированные запросы с агрегацией MongoDB
- Индексы для быстрого поиска по типу турнира
- Эффективная генерация турнирных сеток для больших турниров

## Совместимость

Все существующие командные турниры продолжают работать без изменений. Новые поля имеют значения по умолчанию для обратной совместимости.

## Тестирование

Созданы комплексные тесты для:
- Unit тесты моделей с новыми полями
- Integration тесты API endpoints
- Performance тесты для больших турниров
- E2E тесты полного жизненного цикла

## Документация

- API примеры в `docs/tournament-api-examples.md`
- Компоненты React/Vue для фронтенда
- TypeScript типы для всех новых интерфейсов