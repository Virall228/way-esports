import React, { createContext, useContext, useState } from 'react';
import type { Language, Translation } from '../types';

const translations: Translation = {
    home: {
        en: 'Home',
        ru: 'Главная'
    },
    tournaments: {
        en: 'Tournaments',
        ru: 'Турниры'
    },
    profile: {
        en: 'Profile',
        ru: 'Профиль'
    },
    wins: {
        en: 'Wins',
        ru: 'Победы'
    },
    losses: {
        en: 'Losses',
        ru: 'Поражения'
    },
    allMatches: {
        en: 'All Matches',
        ru: 'Все матчи'
    },
    tournamentMatches: {
        en: 'Tournament Matches',
        ru: 'Турнирные матчи'
    },
    casualMatches: {
        en: 'Casual Matches',
        ru: 'Обычные матчи'
    },
    victory: {
        en: 'VICTORY',
        ru: 'ПОБЕДА'
    },
    defeat: {
        en: 'DEFEAT',
        ru: 'ПОРАЖЕНИЕ'
    },
    players: {
        en: 'players',
        ru: 'игроков'
    },
    damage: {
        en: 'Damage',
        ru: 'Урон'
    },
    score: {
        en: 'Score',
        ru: 'Счёт'
    },
    prizePool: {
        en: 'Prize Pool',
        ru: 'Призовой фонд'
    },
    startDate: {
        en: 'Start Date',
        ru: 'Дата начала'
    },
    teams: {
        en: 'Teams',
        ru: 'Команды'
    },
    game: {
        en: 'Game',
        ru: 'Игра'
    },
    live: {
        en: 'LIVE',
        ru: 'LIVE'
    },
    news: {
        en: 'News',
        ru: 'Новости'
    },
    all: {
        en: 'All News',
        ru: 'Все новости'
    },
    updates: {
        en: 'Updates',
        ru: 'Обновления'
    },
    community: {
        en: 'Community',
        ru: 'Сообщество'
    },
    back: {
        en: 'Back to News',
        ru: 'Назад к новостям'
    },
    share: {
        en: 'Share this article',
        ru: 'Поделиться статьей'
    },
    readMore: {
        en: 'Read More',
        ru: 'Читать далее'
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