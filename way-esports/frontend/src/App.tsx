import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles, theme } from './styles/theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import News from './pages/News';
import { AppProvider } from './contexts/AppContext';
import PreLoader from './components/PreLoader/PreLoader';
import styled from 'styled-components';

const AppContainer = styled.div`
    min-height: 100vh;
    background: #1a1a1a;
`;

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState('Initializing...');

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Simulate loading stages
                setLoadingStatus('Connecting to Telegram...');
                await new Promise(resolve => setTimeout(resolve, 1000));

                setLoadingStatus('Loading user data...');
                await new Promise(resolve => setTimeout(resolve, 800));

                setLoadingStatus('Preparing interface...');
                await new Promise(resolve => setTimeout(resolve, 600));

                // Initialize Telegram WebApp
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();

                setIsLoading(false);
            } catch (error) {
                console.error('Error initializing app:', error);
                setLoadingStatus('Error loading app. Please try again.');
            }
        };

        initializeApp();
    }, []);

    return (
        <AppProvider>
            <ThemeProvider theme={theme}>
                <GlobalStyles />
                <BrowserRouter>
                    <AppContainer>
                        {isLoading ? (
                            <PreLoader status={loadingStatus} />
                        ) : (
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/tournaments" element={<Tournaments />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/news" element={<News />} />
                                </Routes>
                            </Layout>
                        )}
                    </AppContainer>
                </BrowserRouter>
            </ThemeProvider>
        </AppProvider>
    );
};

export default App; 