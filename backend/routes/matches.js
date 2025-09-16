const express = require('express');
const router = express.Router();
// Простые middleware для тестирования
const authenticateToken = (req, res, next) => {
  req.user = { id: 'test-user', username: 'TestUser' };
  next();
};

const requireSubscription = (req, res, next) => {
  next();
};

// Mock данные для демонстрации
let tournaments = new Map();
let matches = new Map();
let brackets = new Map();
let matchReports = new Map();
let disputes = new Map();

// Инициализация mock данных
const initializeMockData = () => {
  // Пример турнирной сетки
  const mockBracket = {
    id: 'bracket_tournament1',
    tournamentId: 'tournament1',
    type: 'swiss',
    swissRounds: 4,
    currentSwissRound: 1,
    swissStandings: [
      {
        participantId: 'team1',
        participant: { id: 'team1', name: 'WAY Warriors', tag: 'WAY', players: [] },
        wins: 0,
        losses: 0,
        buchholz: 0,
        matchHistory: [],
        isEliminated: false,
        isQualified: false
      },
      {
        participantId: 'team2',
        participant: { id: 'team2', name: 'Critical Strike', tag: 'CS', players: [] },
        wins: 0,
        losses: 0,
        buchholz: 0,
        matchHistory: [],
        isEliminated: false,
        isQualified: false
      }
    ],
    playoffMatches: [],
    playoffStarted: false,
    matches: [],
    maxRounds: 7,
    qualificationSpots: 8,
    eliminationThreshold: 3
  };

  brackets.set('tournament1', mockBracket);
};

initializeMockData();

// Создание турнирной сетки
router.post('/bracket', authenticateToken, async (req, res) => {
  try {
    const bracket = req.body;
    bracket.id = `bracket_${bracket.tournamentId}`;
    bracket.createdAt = new Date().toISOString();
    
    brackets.set(bracket.tournamentId, bracket);
    
    res.json(bracket);
  } catch (error) {
    console.error('Error creating bracket:', error);
    res.status(500).json({ error: 'Failed to create tournament bracket' });
  }
});

// Получение турнирной сетки
router.get('/bracket/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const bracket = brackets.get(tournamentId);
    
    if (!bracket) {
      return res.status(404).json({ error: 'Tournament bracket not found' });
    }
    
    res.json(bracket);
  } catch (error) {
    console.error('Error fetching bracket:', error);
    res.status(500).json({ error: 'Failed to fetch tournament bracket' });
  }
});

// Обновление турнирной сетки после матча
router.post('/bracket/update', authenticateToken, async (req, res) => {
  try {
    const { matchId, winnerId } = req.body;
    
    // Найти матч и обновить турнирную сетку
    let updatedBracket = null;
    
    for (const [tournamentId, bracket] of brackets.entries()) {
      const match = bracket.matches.find(m => m.id === matchId);
      if (match) {
        // Обновляем статус матча
        match.status = 'completed';
        match.winner = winnerId;
        match.endTime = new Date().toISOString();
        
        // Обновляем швейцарскую таблицу
        const winnerStanding = bracket.swissStandings.find(s => 
          s.participantId === winnerId || 
          s.participantId === (winnerId === 'team1' ? match.team1?.id : match.team2?.id) ||
          s.participantId === (winnerId === 'player1' ? match.player1?.id : match.player2?.id)
        );
        
        const loserId = winnerId === 'team1' || winnerId === 'player1' ? 
          (match.team2?.id || match.player2?.id) : 
          (match.team1?.id || match.player1?.id);
          
        const loserStanding = bracket.swissStandings.find(s => s.participantId === loserId);
        
        if (winnerStanding) {
          winnerStanding.wins++;
          winnerStanding.matchHistory.push(matchId);
          
          // Проверяем квалификацию
          if (winnerStanding.wins >= 3) {
            winnerStanding.isQualified = true;
          }
        }
        
        if (loserStanding) {
          loserStanding.losses++;
          loserStanding.matchHistory.push(matchId);
          
          // Проверяем исключение
          if (loserStanding.losses >= 3) {
            loserStanding.isEliminated = true;
          }
        }
        
        // Обновляем Buchholz (упрощенная версия)
        bracket.swissStandings.forEach(standing => {
          standing.buchholz = standing.wins * 3 + standing.losses * 1;
        });
        
        updatedBracket = bracket;
        brackets.set(tournamentId, bracket);
        break;
      }
    }
    
    if (!updatedBracket) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(updatedBracket);
  } catch (error) {
    console.error('Error updating bracket:', error);
    res.status(500).json({ error: 'Failed to update bracket' });
  }
});

// Генерация следующего раунда
router.post('/bracket/:tournamentId/next-round', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const bracket = brackets.get(tournamentId);
    
    if (!bracket) {
      return res.status(404).json({ error: 'Tournament bracket not found' });
    }
    
    // Проверяем, что все матчи текущего раунда завершены
    const currentRoundMatches = bracket.matches.filter(m => m.swissRound === bracket.currentSwissRound);
    const allCompleted = currentRoundMatches.every(m => m.status === 'completed');
    
    if (!allCompleted) {
      return res.status(400).json({ error: 'Current round is not completed yet' });
    }
    
    // Генерируем новый раунд
    bracket.currentSwissRound++;
    const newMatches = generateSwissRound(bracket, bracket.currentSwissRound);
    bracket.matches.push(...newMatches);
    
    brackets.set(tournamentId, bracket);
    
    res.json(newMatches);
  } catch (error) {
    console.error('Error generating next round:', error);
    res.status(500).json({ error: 'Failed to generate next round' });
  }
});

// Начало плейофф
router.post('/bracket/:tournamentId/playoffs', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const bracket = brackets.get(tournamentId);
    
    if (!bracket) {
      return res.status(404).json({ error: 'Tournament bracket not found' });
    }
    
    // Получаем квалифицированных участников
    const qualified = bracket.swissStandings
      .filter(s => s.isQualified || s.wins >= 3)
      .sort((a, b) => {
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.buchholz - a.buchholz;
      })
      .slice(0, bracket.qualificationSpots);
    
    // Создаем плейофф матчи (single elimination)
    const playoffMatches = [];
    for (let i = 0; i < qualified.length; i += 2) {
      if (i + 1 < qualified.length) {
        const match = {
          id: `playoff_${tournamentId}_${Math.floor(i/2) + 1}`,
          tournamentId,
          round: 1,
          matchNumber: Math.floor(i/2) + 1,
          format: 'bo3',
          maps: getRandomMaps('CS2', 3),
          status: 'scheduled',
          results: [],
          scheduledTime: new Date(Date.now() + (i * 60 * 60 * 1000)).toISOString(),
          swissRound: 0,
          team1Wins: qualified[i].wins,
          team1Losses: qualified[i].losses,
          team2Wins: qualified[i + 1].wins,
          team2Losses: qualified[i + 1].losses
        };
        
        // Добавляем участников
        if ('name' in qualified[i].participant) {
          match.team1 = qualified[i].participant;
          match.team2 = qualified[i + 1].participant;
        } else {
          match.player1 = qualified[i].participant;
          match.player2 = qualified[i + 1].participant;
        }
        
        playoffMatches.push(match);
      }
    }
    
    bracket.playoffMatches = playoffMatches;
    bracket.playoffStarted = true;
    
    brackets.set(tournamentId, bracket);
    
    res.json(bracket);
  } catch (error) {
    console.error('Error starting playoffs:', error);
    res.status(500).json({ error: 'Failed to start playoffs' });
  }
});

// Получение конкретного матча
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // Ищем матч во всех турнирах
    let foundMatch = null;
    for (const bracket of brackets.values()) {
      const match = bracket.matches.find(m => m.id === matchId) || 
                   bracket.playoffMatches.find(m => m.id === matchId);
      if (match) {
        foundMatch = match;
        break;
      }
    }
    
    if (!foundMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(foundMatch);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Отправка результата матча
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const report = {
      id: `report_${Date.now()}`,
      ...req.body,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    matchReports.set(report.id, report);
    
    res.json(report);
  } catch (error) {
    console.error('Error submitting match report:', error);
    res.status(500).json({ error: 'Failed to submit match report' });
  }
});

// Подтверждение результата матча (админ)
router.post('/report/:reportId/approve', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = matchReports.get(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Match report not found' });
    }
    
    report.status = 'approved';
    report.approvedAt = new Date().toISOString();
    
    // Обновляем матч с результатами
    for (const bracket of brackets.values()) {
      const match = bracket.matches.find(m => m.id === report.matchId) ||
                   bracket.playoffMatches.find(m => m.id === report.matchId);
      if (match) {
        match.results = report.results;
        match.status = 'completed';
        match.endTime = new Date().toISOString();
        
        // Определяем победителя
        const team1Wins = report.results.filter(r => r.winner === 'team1' || r.winner === 'player1').length;
        const team2Wins = report.results.filter(r => r.winner === 'team2' || r.winner === 'player2').length;
        
        if (team1Wins > team2Wins) {
          match.winner = match.team1 ? 'team1' : 'player1';
        } else {
          match.winner = match.team2 ? 'team2' : 'player2';
        }
        
        break;
      }
    }
    
    matchReports.set(reportId, report);
    
    res.json({ message: 'Match result approved successfully' });
  } catch (error) {
    console.error('Error approving match result:', error);
    res.status(500).json({ error: 'Failed to approve match result' });
  }
});

// Создание спора по матчу
router.post('/dispute', authenticateToken, async (req, res) => {
  try {
    const dispute = {
      id: `dispute_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    disputes.set(dispute.id, dispute);
    
    res.json(dispute);
  } catch (error) {
    console.error('Error creating match dispute:', error);
    res.status(500).json({ error: 'Failed to create match dispute' });
  }
});

// Получение споров по матчу
router.get('/:matchId/disputes', async (req, res) => {
  try {
    const { matchId } = req.params;
    const matchDisputes = Array.from(disputes.values())
      .filter(dispute => dispute.matchId === matchId);
    
    res.json(matchDisputes);
  } catch (error) {
    console.error('Error fetching match disputes:', error);
    res.status(500).json({ error: 'Failed to fetch match disputes' });
  }
});

// Отмена матча
router.post('/:matchId/cancel', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { reason } = req.body;
    
    // Находим и отменяем матч
    let foundMatch = null;
    for (const bracket of brackets.values()) {
      const match = bracket.matches.find(m => m.id === matchId) ||
                   bracket.playoffMatches.find(m => m.id === matchId);
      if (match) {
        match.status = 'cancelled';
        match.adminNotes = reason;
        foundMatch = match;
        break;
      }
    }
    
    if (!foundMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(foundMatch);
  } catch (error) {
    console.error('Error cancelling match:', error);
    res.status(500).json({ error: 'Failed to cancel match' });
  }
});

// Вспомогательные функции
function generateSwissRound(bracket, round) {
  const availableParticipants = bracket.swissStandings
    .filter(standing => !standing.isEliminated && !standing.isQualified)
    .sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      return b.buchholz - a.buchholz;
    });

  const matches = [];
  const paired = new Set();

  for (let i = 0; i < availableParticipants.length; i++) {
    if (paired.has(availableParticipants[i].participantId)) continue;

    const participant1 = availableParticipants[i];
    let opponent = null;

    for (let j = i + 1; j < availableParticipants.length; j++) {
      const candidate = availableParticipants[j];
      
      if (paired.has(candidate.participantId)) continue;
      if (participant1.matchHistory.includes(candidate.participantId)) continue;

      opponent = candidate;
      break;
    }

    if (opponent) {
      const match = {
        id: `match_${bracket.tournamentId}_${round}_${matches.length + 1}`,
        tournamentId: bracket.tournamentId,
        round,
        matchNumber: matches.length + 1,
        format: round >= bracket.swissRounds ? 'bo3' : 'bo1',
        maps: getRandomMaps('CS2', round >= bracket.swissRounds ? 3 : 1),
        status: 'scheduled',
        results: [],
        scheduledTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        swissRound: round,
        team1Wins: participant1.wins,
        team1Losses: participant1.losses,
        team2Wins: opponent.wins,
        team2Losses: opponent.losses
      };

      // Добавляем участников
      if ('name' in participant1.participant) {
        match.team1 = participant1.participant;
        match.team2 = opponent.participant;
      } else {
        match.player1 = participant1.participant;
        match.player2 = opponent.participant;
      }

      matches.push(match);
      paired.add(participant1.participantId);
      paired.add(opponent.participantId);
    }
  }

  return matches;
}

function getRandomMaps(game, count) {
  const gameMaps = {
    'CS2': [
      { id: 'mirage', name: 'Mirage', image: '/maps/cs2/mirage.jpg', game: 'CS2' },
      { id: 'inferno', name: 'Inferno', image: '/maps/cs2/inferno.jpg', game: 'CS2' },
      { id: 'dust2', name: 'Dust2', image: '/maps/cs2/dust2.jpg', game: 'CS2' },
      { id: 'cache', name: 'Cache', image: '/maps/cs2/cache.jpg', game: 'CS2' },
      { id: 'overpass', name: 'Overpass', image: '/maps/cs2/overpass.jpg', game: 'CS2' }
    ]
  };

  const maps = gameMaps[game] || gameMaps['CS2'];
  const selectedMaps = [];
  const usedIndices = new Set();

  while (selectedMaps.length < count && usedIndices.size < maps.length) {
    const randomIndex = Math.floor(Math.random() * maps.length);
    if (!usedIndices.has(randomIndex)) {
      selectedMaps.push(maps[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  return selectedMaps;
}

module.exports = router;