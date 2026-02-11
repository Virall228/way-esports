import React, { createContext, useContext, useState } from 'react';
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
    profile: {
        en: 'Profile',
        ru: '\u041F\u0440\u043E\u0444\u0438\u043B\u044C'
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
    teams: {
        en: 'Teams',
        ru: '\u041A\u043E\u043C\u0430\u043D\u0434\u044B'
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
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
