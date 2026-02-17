import React, { useState } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const Container = styled.div`
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 20px;
`;

const Section = styled.div`
    background: ${({ theme }) => theme.colors.glass.panel};
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid ${({ theme }) => theme.colors.glass.panelBorder};
`;

const SectionTitle = styled.h2`
    color: #FF6B00;
    font-size: 24px;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
        width: 24px;
        height: 24px;
    }
`;

const SettingRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.medium};

    &:last-child {
        border-bottom: none;
    }
`;

const SettingLabel = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 16px;
`;

const SettingDescription = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 14px;
    margin-top: 4px;
`;

const SettingValue = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 15px;
    font-weight: 600;
`;

const ThemeToggle = styled.button<{ isLight: boolean }>`
    background: ${({ isLight, theme }) => (isLight ? theme.colors.surface : theme.colors.bg.secondary)};
    border: 2px solid ${({ isLight, theme }) => (isLight ? theme.colors.border.light : theme.colors.border.medium)};
    width: 64px;
    height: 32px;
    border-radius: 16px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;

    &:after {
        content: '';
        position: absolute;
        top: 2px;
        left: ${props => props.isLight ? 'calc(100% - 26px)' : '2px'};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${props => props.isLight ? '#FF6B00' : '#FFD700'};
        transition: all 0.3s ease;
    }
`;

const LanguageButton = styled.button<{ active: boolean }>`
    background: ${props => props.active ? 'linear-gradient(135deg, #FF6B00 0%, #FFD700 100%)' : 'transparent'};
    color: ${props => props.active ? '#000' : '#FF6B00'};
    border: 2px solid #FF6B00;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-right: 10px;

    &:hover {
        background: ${props => !props.active && 'rgba(255, 107, 0, 0.1)'};
    }
`;

const ContactForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Input = styled.input`
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border.medium};
    border-radius: 8px;
    padding: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 16px;
    width: 100%;

    &:focus {
        outline: none;
        border-color: #FF6B00;
    }
`;

const TextArea = styled.textarea`
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border.medium};
    border-radius: 8px;
    padding: 12px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 16px;
    width: 100%;
    min-height: 120px;
    resize: vertical;

    &:focus {
        outline: none;
        border-color: #FF6B00;
    }
`;

const SubmitButton = styled.button`
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    color: #000;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.3s ease;
    align-self: flex-start;

    &:hover {
        opacity: 0.9;
    }
`;

const ContactInfo = styled.div`
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const ContactItem = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: ${({ theme }) => theme.colors.text.primary};

    svg {
        color: #FF6B00;
    }

    a {
        color: #FF6B00;
        text-decoration: none;
        
        &:hover {
            text-decoration: underline;
        }
    }
`;

const SettingsPage: React.FC = () => {
    const { isDarkMode, toggleDarkMode } = useApp();
    const { language, setLanguage, t } = useLanguage();
    const { user } = useAuth();
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [submitState, setSubmitState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
        status: 'idle'
    });

    const handleThemeToggle = () => {
        toggleDarkMode();
    };

    const handleLanguageChange = (lang: 'en' | 'ru') => {
        setLanguage(lang);
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitState({ status: 'loading' });
            await api.post('/api/contact', contactForm, true);
            setSubmitState({ status: 'success', message: 'Message sent successfully!' });
            setContactForm({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error sending message:', error);
            setSubmitState({ status: 'error', message: 'Failed to send message. Please try again.' });
        }
    };

    return (
        <Container>
            <Section>
                <SectionTitle>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5zm0 2c-3.31 0-10 1.66-10 5v2h20v-2c0-3.34-6.69-5-10-5z"/>
                    </svg>
                    Account
                </SectionTitle>
                <SettingRow>
                    <div>
                        <SettingLabel>Username</SettingLabel>
                        <SettingDescription>Public name for your profile and teams</SettingDescription>
                    </div>
                    <SettingValue>{user?.username || '-'}</SettingValue>
                </SettingRow>
                <SettingRow>
                    <div>
                        <SettingLabel>Email</SettingLabel>
                        <SettingDescription>Visible only to you in Settings</SettingDescription>
                    </div>
                    <SettingValue>{user?.email || 'Not set'}</SettingValue>
                </SettingRow>
            </Section>

            <Section>
                <SectionTitle>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"/>
                        <path d="M12 2L9.2 4.8 6 4l.8 3.2L4 12l2.8 2.8L6 18l3.2-.8L12 20l2.8-2.8 3.2.8-.8-3.2L20 12l-2.8-2.8L18 6l-3.2.8L12 2z"/>
                    </svg>
                    {t('appearance')}
                </SectionTitle>
                <SettingRow>
                    <div>
                        <SettingLabel>{t('theme')}</SettingLabel>
                        <SettingDescription>{t('chooseTheme')}</SettingDescription>
                    </div>
                    <ThemeToggle 
                        isLight={!isDarkMode}
                        onClick={handleThemeToggle}
                    />
                </SettingRow>
                <SettingRow>
                    <div>
                        <SettingLabel>{t('language')}</SettingLabel>
                        <SettingDescription>{t('selectLanguage')}</SettingDescription>
                    </div>
                    <div>
                        <LanguageButton 
                            active={language === 'en'}
                            onClick={() => handleLanguageChange('en')}
                        >
                            EN
                        </LanguageButton>
                        <LanguageButton 
                            active={language === 'ru'}
                            onClick={() => handleLanguageChange('ru')}
                        >
                            RU
                        </LanguageButton>
                    </div>
                </SettingRow>
            </Section>

            <Section>
                <SectionTitle>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                    </svg>
                    {t('contactUs')}
                </SectionTitle>
                <ContactForm onSubmit={handleContactSubmit}>
                    <Input
                        type="text"
                        placeholder={t('yourName')}
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <Input
                        type="email"
                        placeholder={t('yourEmail')}
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                    />
                    <TextArea
                        placeholder={t('yourMessage')}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        required
                    />
                    <SubmitButton type="submit" disabled={submitState.status === 'loading'}>
                        {submitState.status === 'loading' ? t('sendingMessage') : t('sendMessage')}
                    </SubmitButton>
                    {submitState.status === 'success' && (
                        <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>{t('messageSent')}</div>
                    )}
                    {submitState.status === 'error' && (
                        <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{t('messageFailed')}</div>
                    )}
                </ContactForm>

                <ContactInfo>
                    <ContactItem>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                        </svg>
                        123 Gaming Street, Esports City
                    </ContactItem>
                    <ContactItem>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                        </svg>
                        <a href="mailto:support@wayesports.com">support@wayesports.com</a>
                    </ContactItem>
                    <ContactItem>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 00-9-9v2c3.87 0 7 3.13 7 7z"/>
                        </svg>
                        <a href="tel:+1234567890">+1 (234) 567-890</a>
                    </ContactItem>
                    <ContactItem>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.47-1.13 7.25-.14.74-.42 1.2-.68 1.23-.57.05-1-.43-1.55-.83l-2.17-1.45c-.96-.64-.31-1 .21-1.57.14-.15 2.5-2.31 2.56-2.51.01-.02.01-.06-.02-.08s-.08-.01-.11.01l-3.16 2.03c-.89.58-1.71.56-2.37.41-.6-.13-1.24-.35-1.86-.55-.73-.23-.95-.73-.95-1.17v-.07c.47-.67 3.11-1.72 5.87-2.95 2.38-1.06 4.64-1.85 5.63-2.02.14-.02.42-.06.6-.06.19 0 .34.02.44.05.21.05.34.16.43.33.07.14.07.27.05.47z"/>
                        </svg>
                        <a href="https://t.me/wayesports" target="_blank" rel="noopener noreferrer">@wayesports</a>
                    </ContactItem>
                </ContactInfo>
            </Section>
        </Container>
    );
};

export default SettingsPage; 
