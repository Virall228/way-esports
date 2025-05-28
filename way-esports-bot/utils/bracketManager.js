const validateTeams = (teams) => {
  if (!Array.isArray(teams)) {
    throw new Error('Teams must be an array');
  }

  if (teams.length < 2) {
    throw new Error('Tournament requires at least 2 teams');
  }

  // Validate each team
  teams.forEach((team, index) => {
    if (!team.name || typeof team.name !== 'string') {
      throw new Error(`Invalid team name for team at index ${index}`);
    }

    if (!Array.isArray(team.players)) {
      throw new Error(`Invalid players array for team ${team.name}`);
    }

    if (team.players.length === 0) {
      throw new Error(`Team ${team.name} must have at least one player`);
    }
  });

  return true;
};

const validateBracketStructure = (bracket) => {
  if (!bracket || !bracket.rounds || !Array.isArray(bracket.rounds)) {
    throw new Error('Invalid bracket structure');
  }

  bracket.rounds.forEach((round, roundIndex) => {
    if (!round.roundNumber || typeof round.roundNumber !== 'number') {
      throw new Error(`Invalid round number in round ${roundIndex + 1}`);
    }

    if (!Array.isArray(round.matches)) {
      throw new Error(`Invalid matches array in round ${roundIndex + 1}`);
    }

    round.matches.forEach((match, matchIndex) => {
      if (!match.matchId || typeof match.matchId !== 'string') {
        throw new Error(`Invalid match ID in round ${roundIndex + 1}, match ${matchIndex + 1}`);
      }

      if (!match.team1 || !match.team2) {
        throw new Error(`Missing team in round ${roundIndex + 1}, match ${matchIndex + 1}`);
      }

      if (match.status !== 'pending' && match.status !== 'in_progress' && match.status !== 'completed') {
        throw new Error(`Invalid match status in round ${roundIndex + 1}, match ${matchIndex + 1}`);
      }
    });
  });

  return true;
};

const generateBracket = (teams) => {
  validateTeams(teams);

  // Sort teams by seed
  const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);
  const rounds = Math.ceil(Math.log2(teams.length));
  const totalTeams = Math.pow(2, rounds);

  // Fill with byes if needed
  while (sortedTeams.length < totalTeams) {
    sortedTeams.push({
      name: 'BYE',
      players: [],
      seed: sortedTeams.length + 1
    });
  }

  const bracket = {
    rounds: []
  };

  // Generate first round with seeding
  const firstRound = {
    roundNumber: 1,
    matches: []
  };

  // Implement proper seeding algorithm
  for (let i = 0; i < sortedTeams.length; i += 2) {
    const matchId = `R1M${i/2 + 1}`;
    const team1Index = i;
    const team2Index = sortedTeams.length - 1 - i;

    firstRound.matches.push({
      matchId,
      team1: {
        name: sortedTeams[team1Index].name,
        score: 0,
        seed: sortedTeams[team1Index].seed
      },
      team2: {
        name: sortedTeams[team2Index].name,
        score: 0,
        seed: sortedTeams[team2Index].seed
      },
      status: 'pending',
      scheduledTime: null
    });
  }

  bracket.rounds.push(firstRound);

  // Generate subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const roundData = {
      roundNumber: round,
      matches: []
    };

    for (let match = 1; match <= matchesInRound; match++) {
      roundData.matches.push({
        matchId: `R${round}M${match}`,
        team1: { name: 'TBD', score: 0, seed: null },
        team2: { name: 'TBD', score: 0, seed: null },
        status: 'pending',
        scheduledTime: null
      });
    }

    bracket.rounds.push(roundData);
  }

  validateBracketStructure(bracket);
  return bracket;
};

const updateBracket = (tournament, roundNumber, matchIndex, team1Score, team2Score) => {
  validateBracketStructure(tournament.bracket);

  const currentMatch = tournament.bracket.rounds[roundNumber - 1].matches[matchIndex];
  
  // Validate scores
  if (typeof team1Score !== 'number' || typeof team2Score !== 'number') {
    throw new Error('Invalid score values');
  }

  if (team1Score < 0 || team2Score < 0) {
    throw new Error('Scores cannot be negative');
  }

  if (team1Score === team2Score) {
    throw new Error('Match cannot end in a tie');
  }

  // Update match scores and status
  currentMatch.team1.score = team1Score;
  currentMatch.team2.score = team2Score;
  currentMatch.status = 'completed';
  currentMatch.winner = team1Score > team2Score ? currentMatch.team1.name : currentMatch.team2.name;

  // Update next round if not final
  if (roundNumber < tournament.bracket.rounds.length) {
    const nextRoundMatch = tournament.bracket.rounds[roundNumber].matches[Math.floor(matchIndex / 2)];
    const winningTeam = team1Score > team2Score ? currentMatch.team1 : currentMatch.team2;

    if (matchIndex % 2 === 0) {
      nextRoundMatch.team1 = {
        name: winningTeam.name,
        score: 0,
        seed: winningTeam.seed
      };
    } else {
      nextRoundMatch.team2 = {
        name: winningTeam.name,
        score: 0,
        seed: winningTeam.seed
      };
    }
  }

  // Check if tournament is completed
  const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
  if (finalRound.matches[0].status === 'completed') {
    tournament.status = 'completed';
  }

  validateBracketStructure(tournament.bracket);
  return tournament;
};

module.exports = {
  validateTeams,
  validateBracketStructure,
  generateBracket,
  updateBracket
}; 