import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Language, Translation } from '../types';

const translations: Translation = {
    home: {
        en: 'Home',
        ru: '\u0413\u043B\u0430\u0432\u043D\u0430\u044F'
    },
    tournaments: {
        en: 'Tournaments',
        ru: '\u0422\u0443\u0440\u043D\u0438\u0440\u044B'
    },
    teams: {
        en: 'Teams',
        ru: '\u041A\u043E\u043C\u0430\u043D\u0434\u044B'
    },
    rankings: {
        en: 'Rankings',
        ru: '\u0420\u0435\u0439\u0442\u0438\u043D\u0433\u0438'
    },
    matches: {
        en: 'Matches',
        ru: '\u041C\u0430\u0442\u0447\u0438'
    },
    prizes: {
        en: 'Prizes',
        ru: '\u041F\u0440\u0438\u0437\u044B'
    },
    profile: {
        en: 'Profile',
        ru: '\u041F\u0440\u043E\u0444\u0438\u043B\u044C'
    },
    wallet: {
        en: 'Wallet',
        ru: '\u041A\u043E\u0448\u0435\u043B\u0435\u043A'
    },
    settings: {
        en: 'Settings',
        ru: '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438'
    },
    admin: {
        en: 'Admin',
        ru: '\u0410\u0434\u043C\u0438\u043D\u043A\u0430'
    },
    menu: {
        en: 'Menu',
        ru: '\u041C\u0435\u043D\u044E'
    },
    onePlatformOneUi: {
        en: 'One Platform \u00b7 One UI',
        ru: '\u041E\u0434\u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u00b7 \u041E\u0434\u0438\u043D \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441'
    },
    appearance: {
        en: 'Appearance',
        ru: '\u0412\u043D\u0435\u0448\u043D\u0438\u0439 \u0432\u0438\u0434'
    },
    theme: {
        en: 'Theme',
        ru: '\u0422\u0435\u043C\u0430'
    },
    chooseTheme: {
        en: 'Choose between light and dark theme',
        ru: '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0432\u0435\u0442\u043B\u0443\u044E \u0438\u043B\u0438 \u0442\u0451\u043C\u043D\u0443\u044E \u0442\u0435\u043C\u0443'
    },
    language: {
        en: 'Language',
        ru: '\u042F\u0437\u044B\u043A'
    },
    selectLanguage: {
        en: 'Select your preferred language',
        ru: '\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430'
    },
    contactUs: {
        en: 'Contact Us',
        ru: '\u0421\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F \u0441 \u043D\u0430\u043C\u0438'
    },
    yourName: {
        en: 'Your Name',
        ru: '\u0412\u0430\u0448\u0435 \u0438\u043C\u044F'
    },
    yourEmail: {
        en: 'Your Email',
        ru: '\u0412\u0430\u0448\u0430 \u043F\u043E\u0447\u0442\u0430'
    },
    yourMessage: {
        en: 'Your Message',
        ru: '\u0412\u0430\u0448\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435'
    },
    sendMessage: {
        en: 'Send Message',
        ru: '\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C'
    },
    sendingMessage: {
        en: 'Sending...',
        ru: '\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430...'
    },
    messageSent: {
        en: 'Message sent successfully!',
        ru: '\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E!'
    },
    messageFailed: {
        en: 'Failed to send message. Please try again.',
        ru: '\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0435 \u0440\u0430\u0437.'
    },
    wins: {
        en: 'Wins',
        ru: '\u041F\u043E\u0431\u0435\u0434\u044B'
    },
    losses: {
        en: 'Losses',
        ru: '\u041F\u043E\u0440\u0430\u0436\u0435\u043D\u0438\u044F'
    },
    allMatches: {
        en: 'All Matches',
        ru: '\u0412\u0441\u0435 \u043C\u0430\u0442\u0447\u0438'
    },
    tournamentMatches: {
        en: 'Tournament Matches',
        ru: '\u0422\u0443\u0440\u043D\u0438\u0440\u043D\u044B\u0435 \u043C\u0430\u0442\u0447\u0438'
    },
    casualMatches: {
        en: 'Casual Matches',
        ru: '\u041E\u0431\u044B\u0447\u043D\u044B\u0435 \u043C\u0430\u0442\u0447\u0438'
    },
    victory: {
        en: 'VICTORY',
        ru: '\u041F\u041E\u0411\u0415\u0414\u0410'
    },
    defeat: {
        en: 'DEFEAT',
        ru: '\u041F\u041E\u0420\u0410\u0416\u0415\u041D\u0418\u0415'
    },
    players: {
        en: 'players',
        ru: '\u0438\u0433\u0440\u043E\u043A\u043E\u0432'
    },
    damage: {
        en: 'Damage',
        ru: '\u0423\u0440\u043E\u043D'
    },
    score: {
        en: 'Score',
        ru: '\u0421\u0447\u0451\u0442'
    },
    prizePool: {
        en: 'Prize Pool',
        ru: '\u041F\u0440\u0438\u0437\u043E\u0432\u043E\u0439 \u0444\u043E\u043D\u0434'
    },
    startDate: {
        en: 'Start Date',
        ru: '\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430'
    },
    game: {
        en: 'Game',
        ru: '\u0418\u0433\u0440\u0430'
    },
    live: {
        en: 'LIVE',
        ru: 'LIVE'
    },
    news: {
        en: 'News',
        ru: '\u041D\u043E\u0432\u043E\u0441\u0442\u0438'
    },
    all: {
        en: 'All News',
        ru: '\u0412\u0441\u0435 \u043D\u043E\u0432\u043E\u0441\u0442\u0438'
    },
    updates: {
        en: 'Updates',
        ru: '\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F'
    },
    community: {
        en: 'Community',
        ru: '\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E'
    },
    back: {
        en: 'Back to News',
        ru: '\u041D\u0430\u0437\u0430\u0434 \u043A \u043D\u043E\u0432\u043E\u0441\u0442\u044F\u043C'
    },
    share: {
        en: 'Share this article',
        ru: '\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0441\u0442\u0430\u0442\u044C\u0435\u0439'
    },
    readMore: {
        en: 'Read More',
        ru: '\u0427\u0438\u0442\u0430\u0442\u044C \u0434\u0430\u043B\u0435\u0435'
    },
    homeHeroSubtitle: {
        en: 'Your ultimate destination for competitive gaming tournaments, team management, and esports excellence.',
        ru: '\u0412\u0430\u0448\u0430 \u043B\u0443\u0447\u0448\u0430\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0430 \u0434\u043B\u044F \u043A\u043E\u043C\u043F\u0435\u0442\u0438\u0442\u0438\u0432\u043D\u044B\u0445 \u0442\u0443\u0440\u043D\u0438\u0440\u043E\u0432, \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439 \u0438 \u043A\u0438\u0431\u0435\u0440\u0441\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u043F\u0440\u0435\u0432\u043E\u0441\u0445\u043E\u0434\u0441\u0442\u0432\u0430.'
    },
    joinTournament: {
        en: 'JOIN TOURNAMENT',
        ru: '\u0412\u0421\u0422\u0423\u041F\u0418\u0422\u042C \u0412 \u0422\u0423\u0420\u041D\u0418\u0420'
    },
    whyChoose: {
        en: 'WHY CHOOSE WAY ESPORTS?',
        ru: '\u041F\u041E\u0427\u0415\u041C\u0423 \u0412\u042B\u0411\u0418\u0420\u0410\u042E\u0422 WAY ESPORTS?'
    },
    featureProfessionalTournaments: {
        en: 'Professional Tournaments',
        ru: '\u041F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0442\u0443\u0440\u043D\u0438\u0440\u044B'
    },
    featureProfessionalTournamentsDesc: {
        en: 'Compete in high-stakes tournaments with substantial prize pools and professional organization.',
        ru: '\u0423\u0447\u0430\u0441\u0442\u0432\u0443\u0439\u0442\u0435 \u0432 \u0442\u0443\u0440\u043D\u0438\u0440\u0430\u0445 \u0441 \u0441\u043E\u043B\u0438\u0434\u043D\u044B\u043C\u0438 \u043F\u0440\u0438\u0437\u043E\u0432\u044B\u043C\u0438 \u0444\u043E\u043D\u0434\u0430\u043C\u0438 \u0438 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0435\u0439.'
    },
    featureTeamManagement: {
        en: 'Team Management',
        ru: '\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439'
    },
    featureTeamManagementDesc: {
        en: 'Create, manage, and lead your esports team with advanced tools and analytics.',
        ru: '\u0421\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435, \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u0438 \u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u0438\u0431\u0435\u0440\u0441\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0443\u044E \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u0441 \u043F\u0440\u043E\u0434\u0432\u0438\u043D\u0443\u0442\u044B\u043C\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430\u043C\u0438 \u0438 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u043E\u0439.'
    },
    featureMultiPlatform: {
        en: 'Multi-Platform Gaming',
        ru: '\u041C\u0443\u043B\u044C\u0442\u0438\u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435\u043D\u043D\u044B\u0435 \u0438\u0433\u0440\u044B'
    },
    featureMultiPlatformDesc: {
        en: 'Participate in tournaments across various popular esports titles and genres.',
        ru: '\u0423\u0447\u0430\u0441\u0442\u0432\u0443\u0439\u0442\u0435 \u0432 \u0442\u0443\u0440\u043D\u0438\u0440\u0430\u0445 \u043F\u043E \u0440\u0430\u0437\u043D\u044B\u043C \u043F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u043C \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430\u043C \u0438 \u0436\u0430\u043D\u0440\u0430\u043C.'
    },
    featureAdvancedAnalytics: {
        en: 'Advanced Analytics',
        ru: '\u041F\u0440\u043E\u0434\u0432\u0438\u043D\u0443\u0442\u0430\u044F \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430'
    },
    featureAdvancedAnalyticsDesc: {
        en: 'Track your performance with detailed statistics and insights to improve your game.',
        ru: '\u041E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0441 \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0439 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u043E\u0439 \u0438 \u0438\u043D\u0441\u0430\u0439\u0442\u0430\u043C\u0438.'
    },
    featureRewardsSystem: {
        en: 'Rewards System',
        ru: '\u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u043D\u0430\u0433\u0440\u0430\u0434'
    },
    featureRewardsSystemDesc: {
        en: 'Earn points, badges, and rewards for your achievements and participation.',
        ru: '\u0417\u0430\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0439\u0442\u0435 \u043E\u0447\u043A\u0438, \u0437\u043D\u0430\u0447\u043A\u0438 \u0438 \u043D\u0430\u0433\u0440\u0430\u0434\u044B \u0437\u0430 \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F.'
    },
    featureGlobalCommunity: {
        en: 'Global Community',
        ru: '\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E'
    },
    featureGlobalCommunityDesc: {
        en: 'Connect with players from around the world and build lasting friendships.',
        ru: '\u0421\u043E\u0431\u0438\u0440\u0430\u0439\u0442\u0435\u0441\u044C \u0441 \u0438\u0433\u0440\u043E\u043A\u0430\u043C\u0438 \u0441\u043E \u0432\u0441\u0435\u0433\u043E \u043C\u0438\u0440\u0430 \u0438 \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0434\u0440\u0443\u0436\u0431\u0443.'
    },
    platformStatistics: {
        en: 'PLATFORM STATISTICS',
        ru: '\u0421\u0422\u0410\u0422\u0418\u0421\u0422\u0418\u041A\u0410 \u041F\u041B\u0410\u0422\u0424\u041E\u0420\u041C\u042B'
    },
    statActiveTournaments: {
        en: 'Active Tournaments',
        ru: '\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0442\u0443\u0440\u043D\u0438\u0440\u044B'
    },
    statRegisteredPlayers: {
        en: 'Registered Players',
        ru: '\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0438\u0433\u0440\u043E\u043A\u0438'
    },
    statActiveTeams: {
        en: 'Active Teams',
        ru: '\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B'
    },
    statTotalPrizePool: {
        en: 'Total Prize Pool',
        ru: '\u041E\u0431\u0449\u0438\u0439 \u043F\u0440\u0438\u0437\u043E\u0432\u043E\u0439 \u0444\u043E\u043D\u0434'
    },
    teamsTitle: {
        en: 'WAY Ranked',
        ru: 'WAY \u0420\u0435\u0439\u0442\u0438\u043D\u0433'
    },
    teamsSubtitle: {
        en: 'A modern ranking system for tracking player and team performance across the platform.',
        ru: '\u0421\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0440\u0435\u0439\u0442\u0438\u043D\u0433\u0430 \u0434\u043B\u044F \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u0438 \u043A\u043E\u043C\u0430\u043D\u0434.'
    },
    teamsSubtitle2: {
        en: 'Compete, climb the leaderboards, and establish your dominance in the esports community.',
        ru: '\u0421\u043E\u0440\u0435\u0432\u043D\u0443\u0439\u0442\u0435\u0441\u044C, \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0439\u0442\u0435\u0441\u044C \u0432 \u0442\u0430\u0431\u043B\u0438\u0446\u0435 \u043B\u0438\u0434\u0435\u0440\u043E\u0432 \u0438 \u0437\u0430\u043A\u0440\u0435\u043F\u0438\u0442\u0435 \u0441\u0432\u043E\u0435 \u0434\u043E\u043C\u0438\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435.'
    },
    allTeams: {
        en: 'All Teams',
        ru: '\u0412\u0441\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B'
    },
    createTeam: {
        en: 'Create Team',
        ru: '\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443'
    },
    viewDetails: {
        en: 'View Details',
        ru: '\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C'
    },
    joinTeam: {
        en: 'Join Team',
        ru: '\u0412\u0441\u0442\u0443\u043F\u0438\u0442\u044C \u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u0443'
    },
    edit: {
        en: 'Edit',
        ru: '\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C'
    },
    delete: {
        en: 'Delete',
        ru: '\u0423\u0434\u0430\u043B\u0438\u0442\u044C'
    },
    tournamentsLabel: {
        en: 'Tournaments',
        ru: '\u0422\u0443\u0440\u043D\u0438\u0440\u044B'
    },
    winRate: {
        en: 'Win Rate',
        ru: '\u0412\u0438\u043D\u0440\u0435\u0439\u0442'
    },
    membersLabel: {
        en: 'Members',
        ru: '\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438'
    },
    loading: {
        en: 'Loading...',
        ru: '\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...'
    },
    tournamentsTitle: {
        en: 'Tournaments',
        ru: '\u0422\u0443\u0440\u043D\u0438\u0440\u044B'
    },
    tournamentsSubtitle: {
        en: 'Compete in tournaments, win prizes, and prove your skills',
        ru: '\u0423\u0447\u0430\u0441\u0442\u0432\u0443\u0439\u0442\u0435 \u0432 \u0442\u0443\u0440\u043D\u0438\u0440\u0430\u0445, \u0432\u044B\u0438\u0433\u0440\u044B\u0432\u0430\u0439\u0442\u0435 \u043F\u0440\u0438\u0437\u044B \u0438 \u0434\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0439\u0442\u0435 \u0441\u0432\u043E\u0439 \u0441\u043A\u0438\u043B\u043B'
    },
    rules: {
        en: 'Rules',
        ru: '\u041F\u0440\u0430\u0432\u0438\u043B\u0430'
    },
    allFilter: {
        en: 'All',
        ru: '\u0412\u0441\u0435'
    },
    upcoming: {
        en: 'Upcoming',
        ru: '\u0421\u043A\u043E\u0440\u043E'
    },
    completed: {
        en: 'Completed',
        ru: '\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u044B'
    },
    joinNow: {
        en: 'Join Now',
        ru: '\u0412\u0441\u0442\u0443\u043F\u0438\u0442\u044C'
    },
    results: {
        en: 'Results',
        ru: '\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B'
    },
    noTournamentsFound: {
        en: 'No tournaments found',
        ru: '\u0422\u0443\u0440\u043D\u0438\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B'
    },
    confirmEntry: {
        en: 'Confirm Entry',
        ru: '\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0432\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435'
    },
    confirmEntryText: {
        en: 'Are you sure you want to register for this tournament?',
        ru: '\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044E \u043D\u0430 \u044D\u0442\u043E\u0442 \u0442\u0443\u0440\u043D\u0438\u0440?'
    },
    confirmJoin: {
        en: 'Confirm & Join',
        ru: '\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0438 \u0432\u0441\u0442\u0443\u043F\u0438\u0442\u044C'
    },
    cancel: {
        en: 'Cancel',
        ru: '\u041E\u0442\u043C\u0435\u043D\u0430'
    },
    recentMatches: {
        en: 'Recent Matches',
        ru: '\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u043C\u0430\u0442\u0447\u0438'
    },
    noRecentMatches: {
        en: 'No matches played yet. Join tournaments to see your match history!',
        ru: '\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u044B\u0445 \u043C\u0430\u0442\u0447\u0435\u0439. \u0412\u0441\u0442\u0443\u043F\u0438\u0442\u0435 \u0432 \u0442\u0443\u0440\u043D\u0438\u0440\u044B, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E!'
    },
    achievementsLabel: {
        en: 'Achievements',
        ru: '\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F'
    },
    noAchievementsYet: {
        en: 'No achievements yet. Keep playing to earn your first achievement!',
        ru: '\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0418\u0433\u0440\u0430\u0439\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u043F\u0435\u0440\u0432\u043E\u0435!'
    },
    matchStatistics: {
        en: 'Match Statistics',
        ru: '\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043C\u0430\u0442\u0447\u0435\u0439'
    },
    noMatchStats: {
        en: 'No match statistics available yet. Start playing to see your performance data!',
        ru: '\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0438\u0433\u0440\u0430\u0442\u044C, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441!'
    },
    editBio: {
        en: 'Edit Bio',
        ru: '\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0431\u0438\u043E'
    },
    save: {
        en: 'Save',
        ru: '\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C'
    },
    saving: {
        en: 'Saving...',
        ru: '\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435...'
    },
    cancelAction: {
        en: 'Cancel',
        ru: '\u041E\u0442\u043C\u0435\u043D\u0430'
    },
    viewPublicProfile: {
        en: 'View Public Profile',
        ru: '\u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C'
    },
    noBio: {
        en: 'No bio set yet. Tell people who you are!',
        ru: '\u0411\u0438\u043E \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0420\u0430\u0441\u0441\u043A\u0430\u0436\u0438\u0442\u0435 \u043E \u0441\u0435\u0431\u0435!'
    },
    participantsLabel: {
        en: 'Participants',
        ru: '\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438'
    },
    dateLabel: {
        en: 'Date',
        ru: '\u0414\u0430\u0442\u0430'
    },
    formatLabel: {
        en: 'Format',
        ru: '\u0424\u043E\u0440\u043C\u0430\u0442'
    },
    comingSoon: {
        en: 'Coming Soon',
        ru: '\u0421\u043A\u043E\u0440\u043E'
    },
    rulesGeneral: {
        en: 'General',
        ru: '\u041E\u0431\u0449\u0438\u0435'
    },
    rulesItem1: {
        en: 'Players must be registered on WAY Esports.',
        ru: '\u0418\u0433\u0440\u043E\u043A\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u043D\u0430 WAY Esports.'
    },
    rulesItem2: {
        en: 'Fair play is mandatory.',
        ru: '\u0427\u0435\u0441\u0442\u043D\u0430\u044F \u0438\u0433\u0440\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430.'
    },
    rulesItem3: {
        en: 'Cheating results in permanent ban.',
        ru: '\u0427\u0438\u0442\u0435\u0440\u0441\u0442\u0432\u043E \u043F\u0440\u0438\u0432\u043E\u0434\u0438\u0442 \u043A \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u043E\u043C\u0443 \u0431\u0430\u043D\u0443.'
    },
    close: {
        en: 'Close',
        ru: '\u0417\u0430\u043A\u0440\u044B\u0442\u044C'
    },
    bioLabel: {
        en: 'Bio',
        ru: '\u0411\u0438\u043E'
    },
    bioPlaceholder: {
        en: 'Tell the world about yourself...',
        ru: '\u0420\u0430\u0441\u0441\u043A\u0430\u0436\u0438\u0442\u0435 \u043E \u0441\u0435\u0431\u0435 \u043C\u0438\u0440\u0443...'
    },
    manageSubscription: {
        en: 'Manage Subscription',
        ru: '\u0423\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u043E\u0439'
    },
    getSubscription: {
        en: 'Get Subscription',
        ru: '\u041E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0443'
    },
    defaultUsername: {
        en: 'Gamer',
        ru: '\u0418\u0433\u0440\u043E\u043A'
    },
    memberLabel: {
        en: 'WAY Esports Member',
        ru: '\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A WAY Esports'
    },
    mvps: {
        en: 'MVPs',
        ru: 'MVP'
    },
    kdRatio: {
        en: 'K/D Ratio',
        ru: 'K/D \u0441\u043E\u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0435'
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const resolveInitialLanguage = (): Language => {
    if (typeof window === 'undefined') return 'en';

    try {
        const saved = localStorage.getItem('language');
        if (saved === 'en' || saved === 'ru') {
            return saved;
        }
    } catch {
        // ignore
    }

    try {
        const tgLang = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
        if (tgLang && typeof tgLang === 'string') {
            return tgLang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
        }
    } catch {
        // ignore
    }

    return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(resolveInitialLanguage);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('language', lang);
        } catch {
            // ignore
        }
    };

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
    };

    const value = useMemo(() => ({ language, setLanguage, t }), [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}; 
