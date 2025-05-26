// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Global state
let currentUser = null;
let tournaments = [];

// DOM Elements
const tournamentsSection = document.getElementById('tournaments');
const profileSection = document.getElementById('profile');
const tournamentsList = document.getElementById('tournaments-list');
const tournamentModal = document.getElementById('tournament-modal');
const createTournamentModal = document.getElementById('create-tournament-modal');
const createTournamentForm = document.getElementById('create-tournament-form');

// Initialize app
async function initApp() {
    try {
        // Get user profile
        const response = await fetch(`/api/profile/${tg.initDataUnsafe.user.id}`, {
            headers: {
                'x-telegram-init-data': tg.initData
            }
        });
        currentUser = await response.json();
        updateProfile();
        
        // Load tournaments
        await loadTournaments();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Tournament Functions
async function loadTournaments() {
    try {
        const response = await fetch('/api/tournaments', {
            headers: {
                'x-telegram-init-data': tg.initData
            }
        });
        tournaments = await response.json();
        renderTournaments();
    } catch (error) {
        console.error('Error loading tournaments:', error);
    }
}

function renderTournaments() {
    tournamentsList.innerHTML = tournaments.map(tournament => `
        <div class="tournament-card" onclick="showTournamentDetails('${tournament._id}')">
            <h3>${tournament.name}</h3>
            <div class="meta">
                <p>${tournament.game}</p>
                <p>${new Date(tournament.startDate).toLocaleDateString()}</p>
            </div>
            <span class="status ${tournament.status}">${tournament.status}</span>
        </div>
    `).join('');
}

async function showTournamentDetails(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
            headers: {
                'x-telegram-init-data': tg.initData
            }
        });
        const tournament = await response.json();
        
        const detailsHtml = `
            <h2>${tournament.name}</h2>
            <div class="tournament-info">
                <p><strong>Game:</strong> ${tournament.game}</p>
                <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleString()}</p>
                <p><strong>Status:</strong> ${tournament.status}</p>
                <p><strong>Teams:</strong> ${tournament.registeredTeams.length}/${tournament.maxTeams}</p>
                ${tournament.prizePool ? `<p><strong>Prize Pool:</strong> $${tournament.prizePool}</p>` : ''}
            </div>
            ${renderBracket(tournament)}
            ${tournament.status === 'upcoming' ? `
                <button onclick="registerTeam('${tournament._id}')" class="primary-btn">Register Team</button>
            ` : ''}
        `;
        
        document.getElementById('tournament-details').innerHTML = detailsHtml;
        tournamentModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading tournament details:', error);
    }
}

function renderBracket(tournament) {
    if (!tournament.bracket || !tournament.bracket.rounds) {
        return '<p>Bracket will be generated when the tournament starts.</p>';
    }

    return `
        <div class="tournament-bracket">
            ${tournament.bracket.rounds.map((round, roundIndex) => `
                <div class="bracket-round">
                    <h4>Round ${round.roundNumber}</h4>
                    ${round.matches.map((match, matchIndex) => `
                        <div class="bracket-match">
                            <div class="bracket-team ${match.winner === match.team1.name ? 'winner' : ''}">
                                <span>${match.team1.name}</span>
                                <span>${match.team1.score || 0}</span>
                            </div>
                            <div class="bracket-team ${match.winner === match.team2.name ? 'winner' : ''}">
                                <span>${match.team2.name}</span>
                                <span>${match.team2.score || 0}</span>
                            </div>
                            ${match.status === 'pending' && tournament.status === 'in_progress' ? `
                                <button onclick="updateScore('${tournament._id}', ${round.roundNumber}, ${matchIndex})" class="primary-btn">Update Score</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

async function registerTeam(tournamentId) {
    const teamName = prompt('Enter team name:');
    if (!teamName) return;

    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-telegram-init-data': tg.initData
            },
            body: JSON.stringify({
                teamName,
                players: [currentUser.telegramId]
            })
        });
        
        if (response.ok) {
            await loadTournaments();
            showTournamentDetails(tournamentId);
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error registering team:', error);
        alert('Failed to register team');
    }
}

async function updateScore(tournamentId, roundNumber, matchIndex) {
    const team1Score = prompt('Enter score for Team 1:');
    const team2Score = prompt('Enter score for Team 2:');
    
    if (!team1Score || !team2Score) return;

    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/matches/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-telegram-init-data': tg.initData
            },
            body: JSON.stringify({
                roundNumber,
                matchIndex,
                team1Score: parseInt(team1Score),
                team2Score: parseInt(team2Score)
            })
        });
        
        if (response.ok) {
            await loadTournaments();
            showTournamentDetails(tournamentId);
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error updating score:', error);
        alert('Failed to update score');
    }
}

// Profile Functions
function updateProfile() {
    document.getElementById('profile-name').textContent = currentUser.nickname || currentUser.username;
    document.getElementById('profile-rank').textContent = currentUser.rank;
    document.getElementById('profile-picture').src = currentUser.profilePicture || 'https://via.placeholder.com/100';
    
    document.getElementById('stats-wins').textContent = currentUser.stats.wins;
    document.getElementById('stats-tournaments').textContent = currentUser.stats.tournamentParticipation;
    const winRate = currentUser.stats.wins / (currentUser.stats.wins + currentUser.stats.losses) * 100 || 0;
    document.getElementById('stats-winrate').textContent = `${winRate.toFixed(1)}%`;
    
    renderAchievements();
}

function renderAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = currentUser.achievements.map(achievement => `
        <div class="achievement-card">
            <img src="https://via.placeholder.com/48" alt="${achievement.name}">
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
        </div>
    `).join('');
}

// Create Tournament
function showCreateTournament() {
    createTournamentModal.style.display = 'block';
}

createTournamentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('tournament-name').value,
        game: document.getElementById('tournament-game').value,
        maxTeams: parseInt(document.getElementById('tournament-max-teams').value),
        startDate: new Date(document.getElementById('tournament-start-date').value),
        endDate: new Date(document.getElementById('tournament-end-date').value),
        prizePool: parseInt(document.getElementById('tournament-prize').value) || 0
    };

    try {
        const response = await fetch('/api/tournaments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-telegram-init-data': tg.initData
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            createTournamentModal.style.display = 'none';
            createTournamentForm.reset();
            await loadTournaments();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        console.error('Error creating tournament:', error);
        alert('Failed to create tournament');
    }
});

// Modal Close Buttons
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').style.display = 'none';
    });
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 