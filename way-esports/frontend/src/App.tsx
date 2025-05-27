import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import LoadingScreen from './components/LoadingScreen';
import Navigation from './components/Navigation';
import Profile from './components/Profile';
import Tournaments from './components/Tournaments';
import TournamentDetails from './components/TournamentDetails';
import MatchHistory from './components/MatchHistory';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LanguageProvider } from './contexts/LanguageContext';
import { NewsPage, NewsDetail } from './components/News';

declare global {
    interface Window {
        Telegram: {
            WebApp: any;
        };
    }
}

const AppContainer = styled.div`
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #1a1a1a;
    color: #ffffff;
    min-height: 100vh;
`;

const MainContent = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding-top: 20px;
`;

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [tournaments, setTournaments] = useState([]);
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        // Initialize Telegram WebApp
        const webapp = window.Telegram.WebApp;
        webapp.ready();
        webapp.expand();

        // Get user data
        const userData = webapp.initDataUnsafe.user;
        setUser({
            id: userData?.id,
            username: userData?.username,
            photoUrl: userData?.photo_url,
            stats: {
                wins: 0,
                losses: 0,
                tournaments: 0
            },
            achievements: ['New Player', 'First Tournament']
        });

        // Hide loading screen after 3.5 seconds
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    const handleTournamentRegister = (tournamentId: string) => {
        // Handle tournament registration
        console.log('Registering for tournament:', tournamentId);
    };

    const handleTournamentDetails = (tournamentId: string) => {
        // Handle viewing tournament details
        console.log('Viewing tournament details:', tournamentId);
    };

    return (
        <LanguageProvider>
            <Router>
                <AppContainer>
                    <LoadingScreen isVisible={isLoading} />
                    <LanguageSwitcher />
                    <MainContent>
                        <Routes>
                            <Route path="/" element={
                                <Tournaments 
                                    tournaments={tournaments}
                                    onRegister={handleTournamentRegister}
                                    onViewDetails={handleTournamentDetails}
                                />
                            } />
                            <Route path="/tournaments" element={
                                <Tournaments 
                                    tournaments={tournaments}
                                    onRegister={handleTournamentRegister}
                                    onViewDetails={handleTournamentDetails}
                                />
                            } />
                            <Route path="/tournaments/:id" element={
                                <TournamentDetails tournament={{
                                    id: '1',
                                    name: 'Sample Tournament',
                                    game: 'CS:GO',
                                    status: 'in_progress',
                                    startDate: new Date().toISOString(),
                                    endDate: new Date().toISOString(),
                                    maxTeams: 8,
                                    registeredTeams: [],
                                    bracket: [
                                        {
                                            name: 'Quarter Finals',
                                            matches: []
                                        }
                                    ]
                                }} />
                            } />
                            <Route path="/profile" element={
                                <>
                                    <Profile user={user} />
                                    <MatchHistory 
                                        matches={matches} 
                                        username={user?.username || ''} 
                                    />
                                </>
                            } />
                            <Route path="/news" element={<NewsPage />} />
                            <Route path="/news/:id" element={<NewsDetail />} />
                        </Routes>
                    </MainContent>
                    <Navigation />
                </AppContainer>
            </Router>
        </LanguageProvider>
    );
};

export default App; 