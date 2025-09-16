# Tournament API Examples

## Создание турниров

### Командный турнир
```javascript
POST /api/tournaments
{
  "name": "CS:GO Championship",
  "game": "CS:GO",
  "startDate": "2024-02-01T10:00:00Z",
  "endDate": "2024-02-01T18:00:00Z",
  "maxTeams": 16,
  "prizePool": 10000,
  "description": "Командный турнир по CS:GO",
  "rules": "Стандартные правила турнира",
  "format": "single_elimination",
  "type": "team"
}
```

### Соло турнир
```javascript
POST /api/tournaments
{
  "name": "Valorant Solo Championship",
  "game": "Valorant",
  "startDate": "2024-02-01T10:00:00Z",
  "endDate": "2024-02-01T18:00:00Z",
  "maxPlayers": 32,
  "prizePool": 5000,
  "description": "Индивидуальный турнир по Valorant",
  "rules": "Стандартные правила турнира",
  "format": "single_elimination",
  "type": "solo"
}
```

### Смешанный турнир
```javascript
POST /api/tournaments
{
  "name": "Mixed Tournament",
  "game": "CS:GO",
  "startDate": "2024-02-01T10:00:00Z",
  "endDate": "2024-02-01T18:00:00Z",
  "maxTeams": 8,
  "maxPlayers": 16,
  "prizePool": 7500,
  "description": "Турнир для команд и соло игроков",
  "rules": "Стандартные правила турнира",
  "format": "single_elimination",
  "type": "mixed"
}
```

## Регистрация в турнирах

### Регистрация команды
```javascript
POST /api/tournaments/:id/register-team
{
  "teamId": "64f8b2c1e4b0a1b2c3d4e5f6"
}
```

### Регистрация соло игрока
```javascript
POST /api/tournaments/:id/register-player
// Тело запроса пустое - используется ID из токена авторизации
```

### Проверка статуса регистрации
```javascript
GET /api/tournaments/:id/registration-status

// Ответ:
{
  "isRegistered": true,
  "registrationType": "player", // или "team"
  "canRegisterAsPlayer": false,
  "canRegisterWithTeam": true
}
```

### Отмена регистрации
```javascript
DELETE /api/tournaments/:id/unregister
```

## Получение турниров

### Все турниры с фильтрацией
```javascript
GET /api/tournaments?type=solo&game=CS:GO&status=registration&page=1&limit=10

// Ответ:
{
  "tournaments": [
    {
      "_id": "64f8b2c1e4b0a1b2c3d4e5f6",
      "name": "CS:GO Solo Championship",
      "game": "CS:GO",
      "type": "solo",
      "status": "registration",
      "maxPlayers": 32,
      "participantCount": 15,
      "spotsRemaining": 17,
      "registeredPlayers": [
        {
          "_id": "64f8b2c1e4b0a1b2c3d4e5f7",
          "username": "player1",
          "avatar": "avatar_url"
        }
      ],
      "prizePool": 5000,
      "startDate": "2024-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Детали турнира
```javascript
GET /api/tournaments/:id

// Ответ включает полную информацию о турнире, включая:
// - registeredTeams (для командных турниров)
// - registeredPlayers (для соло турниров)
// - bracket (турнирная сетка)
```

## Управление турниром

### Запуск турнира
```javascript
POST /api/tournaments/:id/start
// Автоматически генерирует турнирную сетку
```

### Обновление результата матча
```javascript
PUT /api/tournaments/:id/matches/:matchId
{
  "score1": 16,
  "score2": 12,
  "winner": "64f8b2c1e4b0a1b2c3d4e5f6",
  "winnerType": "player" // или "team"
}
```

## Примеры для фронтенда

### React компонент для регистрации
```jsx
const TournamentRegistration = ({ tournament, user }) => {
  const [registrationStatus, setRegistrationStatus] = useState(null);

  useEffect(() => {
    fetchRegistrationStatus();
  }, [tournament._id]);

  const fetchRegistrationStatus = async () => {
    const response = await fetch(`/api/tournaments/${tournament._id}/registration-status`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    const data = await response.json();
    setRegistrationStatus(data);
  };

  const registerAsPlayer = async () => {
    try {
      await fetch(`/api/tournaments/${tournament._id}/register-player`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      fetchRegistrationStatus();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const registerTeam = async (teamId) => {
    try {
      await fetch(`/api/tournaments/${tournament._id}/register-team`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamId })
      });
      fetchRegistrationStatus();
    } catch (error) {
      console.error('Team registration failed:', error);
    }
  };

  if (!registrationStatus) return <div>Loading...</div>;

  return (
    <div className="tournament-registration">
      <h3>{tournament.name}</h3>
      <p>Type: {tournament.type}</p>
      <p>Participants: {tournament.participantCount} / {tournament.maxTeams || tournament.maxPlayers}</p>
      
      {registrationStatus.isRegistered ? (
        <div>
          <p>✅ Registered as {registrationStatus.registrationType}</p>
          <button onClick={unregister}>Unregister</button>
        </div>
      ) : (
        <div>
          {registrationStatus.canRegisterAsPlayer && (
            <button onClick={registerAsPlayer}>
              Register as Solo Player
            </button>
          )}
          
          {registrationStatus.canRegisterWithTeam && (
            <TeamSelector onSelect={registerTeam} />
          )}
        </div>
      )}
    </div>
  );
};
```

### Vue компонент для списка турниров
```vue
<template>
  <div class="tournaments-list">
    <div class="filters">
      <select v-model="filters.type" @change="fetchTournaments">
        <option value="">All Types</option>
        <option value="team">Team</option>
        <option value="solo">Solo</option>
        <option value="mixed">Mixed</option>
      </select>
      
      <select v-model="filters.game" @change="fetchTournaments">
        <option value="">All Games</option>
        <option value="CS:GO">CS:GO</option>
        <option value="Valorant">Valorant</option>
        <option value="Dota 2">Dota 2</option>
      </select>
    </div>

    <div class="tournaments">
      <div 
        v-for="tournament in tournaments" 
        :key="tournament._id"
        class="tournament-card"
      >
        <h3>{{ tournament.name }}</h3>
        <div class="tournament-info">
          <span class="type">{{ tournament.type }}</span>
          <span class="game">{{ tournament.game }}</span>
          <span class="prize">${{ tournament.prizePool }}</span>
        </div>
        
        <div class="participants">
          <span v-if="tournament.type === 'team'">
            Teams: {{ tournament.participantCount }} / {{ tournament.maxTeams }}
          </span>
          <span v-else-if="tournament.type === 'solo'">
            Players: {{ tournament.participantCount }} / {{ tournament.maxPlayers }}
          </span>
          <span v-else>
            Participants: {{ tournament.participantCount }} / 
            {{ (tournament.maxTeams || 0) + (tournament.maxPlayers || 0) }}
          </span>
        </div>

        <div class="registered-participants">
          <div v-if="tournament.registeredTeams?.length" class="teams">
            <h4>Teams:</h4>
            <div v-for="team in tournament.registeredTeams" :key="team._id">
              {{ team.name }} [{{ team.tag }}]
            </div>
          </div>
          
          <div v-if="tournament.registeredPlayers?.length" class="players">
            <h4>Players:</h4>
            <div v-for="player in tournament.registeredPlayers" :key="player._id">
              {{ player.username }}
            </div>
          </div>
        </div>

        <button @click="viewTournament(tournament._id)">
          View Details
        </button>
      </div>
    </div>

    <div class="pagination">
      <button 
        @click="prevPage" 
        :disabled="!pagination.hasPrev"
      >
        Previous
      </button>
      
      <span>Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
      
      <button 
        @click="nextPage" 
        :disabled="!pagination.hasNext"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tournaments: [],
      pagination: {},
      filters: {
        type: '',
        game: '',
        status: 'registration',
        page: 1,
        limit: 10
      }
    };
  },
  
  mounted() {
    this.fetchTournaments();
  },
  
  methods: {
    async fetchTournaments() {
      const params = new URLSearchParams();
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/tournaments?${params}`);
      const data = await response.json();
      
      this.tournaments = data.tournaments;
      this.pagination = data.pagination;
    },
    
    nextPage() {
      this.filters.page++;
      this.fetchTournaments();
    },
    
    prevPage() {
      this.filters.page--;
      this.fetchTournaments();
    },
    
    viewTournament(id) {
      this.$router.push(`/tournaments/${id}`);
    }
  }
};
</script>
```

## Типы данных TypeScript

```typescript
interface Tournament {
  _id: string;
  name: string;
  game: string;
  type: 'team' | 'solo' | 'mixed';
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  maxTeams?: number;
  maxPlayers?: number;
  prizePool: number;
  description: string;
  rules: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  participantCount: number;
  spotsRemaining: number;
  registeredTeams: Team[];
  registeredPlayers: Player[];
  bracket: Bracket;
  createdAt: string;
  updatedAt: string;
}

interface RegistrationStatus {
  isRegistered: boolean;
  registrationType: 'player' | 'team' | null;
  canRegisterAsPlayer: boolean;
  canRegisterWithTeam: boolean;
}

interface Match {
  _id: string;
  team1?: string;
  team2?: string;
  player1?: string;
  player2?: string;
  score1: number;
  score2: number;
  winner?: string;
  winnerType?: 'team' | 'player';
  status: 'pending' | 'in_progress' | 'completed';
  round: number;
  matchNumber: number;
}
```