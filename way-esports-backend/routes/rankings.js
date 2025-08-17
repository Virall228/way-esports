const router = require('express').Router();
const Team = require('../models/Team');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

// Get team rankings
router.get('/teams/rankings', async (req, res) => {
    try {
        const { timeFrame, game } = req.query;
        const query = {};
        
        // Add game filter if specified
        if (game && game !== 'all') {
            query.game = game;
        }

        // Add time frame filter
        if (timeFrame === 'month') {
            query.createdAt = { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) };
        } else if (timeFrame === 'week') {
            query.createdAt = { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) };
        }

        // Aggregate team statistics
        const teams = await Team.aggregate([
            {
                $lookup: {
                    from: 'tournaments',
                    localField: '_id',
                    foreignField: 'registeredTeams',
                    as: 'tournaments'
                }
            },
            {
                $match: query
            },
            {
                $project: {
                    name: 1,
                    logo: 1,
                    totalPrize: { $sum: '$tournaments.prizeWon' },
                    tournamentWins: {
                        $size: {
                            $filter: {
                                input: '$tournaments',
                                as: 'tournament',
                                cond: { $eq: ['$$tournament.winner', '$_id'] }
                            }
                        }
                    },
                    matches: {
                        $size: '$tournaments'
                    },
                    wins: {
                        $size: {
                            $filter: {
                                input: '$tournaments',
                                as: 'tournament',
                                cond: { $gt: ['$$tournament.position', 0] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    winRate: {
                        $multiply: [
                            { $divide: ['$wins', { $max: ['$matches', 1] }] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: {
                    totalPrize: -1,
                    tournamentWins: -1,
                    winRate: -1
                }
            }
        ]);

        // Add ranking position
        const rankedTeams = teams.map((team, index) => ({
            ...team,
            rank: index + 1
        }));

        res.json(rankedTeams);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get player rankings
router.get('/players/rankings', async (req, res) => {
    try {
        const { timeFrame, game } = req.query;
        const query = {};
        
        // Add game filter if specified
        if (game && game !== 'all') {
            query.game = game;
        }

        // Add time frame filter
        if (timeFrame === 'month') {
            query.createdAt = { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) };
        } else if (timeFrame === 'week') {
            query.createdAt = { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) };
        }

        // Aggregate player statistics
        const players = await User.aggregate([
            {
                $lookup: {
                    from: 'teams',
                    localField: '_id',
                    foreignField: 'players',
                    as: 'team'
                }
            },
            {
                $lookup: {
                    from: 'matches',
                    localField: '_id',
                    foreignField: 'players',
                    as: 'matches'
                }
            },
            {
                $match: query
            },
            {
                $project: {
                    name: 1,
                    avatar: 1,
                    team: { $arrayElemAt: ['$team.name', 0] },
                    rating: 1,
                    matches: { $size: '$matches' },
                    wins: {
                        $size: {
                            $filter: {
                                input: '$matches',
                                as: 'match',
                                cond: { $eq: ['$$match.winner', '$_id'] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    winRate: {
                        $multiply: [
                            { $divide: ['$wins', { $max: ['$matches', 1] }] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: {
                    rating: -1,
                    winRate: -1,
                    matches: -1
                }
            }
        ]);

        // Add ranking position
        const rankedPlayers = players.map((player, index) => ({
            ...player,
            rank: index + 1
        }));

        res.json(rankedPlayers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router; 