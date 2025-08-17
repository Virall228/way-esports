const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Простая аутентификация для тестирования
const authenticateToken = (req, res, next) => {
  // Для тестирования пропускаем все запросы
  req.user = { id: 'test-user', username: 'TestUser' };
  next();
};

// Подключаем роуты матчей
const matchesRouter = require('./routes/matches');
app.use('/api/matches', matchesRouter);

// Базовый роут для проверки
app.get('/', (req, res) => {
  res.json({ 
    message: 'WAY Esports Match System Test Server',
    status: 'running',
    endpoints: [
      'GET /api/matches/bracket/:tournamentId',
      'POST /api/matches/bracket',
      'POST /api/matches/report',
      'POST /api/matches/bracket/:tournamentId/next-round',
      'POST /api/matches/bracket/:tournamentId/playoffs'
    ]
  });
});

// Проверка здоровья API
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Match System Test Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎮 Tournament bracket: http://localhost:${PORT}/api/matches/bracket/tournament1`);
});

module.exports = app;