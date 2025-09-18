import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { generateWayId } from '../../utils/idGenerator';
import ProfileLogo from '../UI/ProfileLogo';

const glowAnimation = keyframes`
    0% { box-shadow: 0 0 10px rgba(255, 107, 0, 0.3); }
    50% { box-shadow: 0 0 20px rgba(255, 107, 0, 0.5); }
    100% { box-shadow: 0 0 10px rgba(255, 107, 0, 0.3); }
`;

const Container = styled.div`
    padding: 20px;
`;

const ProfileHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
    flex-wrap: wrap;
`;

const AvatarContainer = styled.div`
    position: relative;
`;

const AvatarUpload = styled.div`
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 107, 0, 0.1);
    border: 2px solid #FF6B00;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: ${glowAnimation} 3s infinite;

    &:hover {
        border-color: #FFD700;
        
        .upload-overlay {
            opacity: 1;
        }
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const UploadOverlay = styled.div.attrs({ className: 'upload-overlay' })`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;

    svg {
        width: 24px;
        height: 24px;
        color: #fff;
    }
`;

const OnlineStatus = styled.div<{ isOnline?: boolean }>`
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${props => props.isOnline ? '#4CAF50' : '#757575'};
    border: 2px solid #1a1a1a;
`;

const ProfileInfo = styled.div`
    flex: 1;
`;

const Username = styled.h2`
    color: #fff;
    margin: 0 0 8px;
    font-size: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const SubscriptionBadge = styled.span`
    background: linear-gradient(135deg, #FF6B00, #FFD700);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    color: #000;
    font-weight: bold;
`;

const Stats = styled.div`
    display: flex;
    gap: 24px;
    margin-top: 16px;
`;

const StatItem = styled.div`
    text-align: center;
`;

const StatValue = styled.div`
    color: #FFD700;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
`;

const StatLabel = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
`;

const ProfileDetails = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:last-child {
        border-bottom: none;
    }
`;

const DetailLabel = styled.span`
    color: rgba(255, 255, 255, 0.7);
`;

const DetailValue = styled.span`
    color: #fff;
    font-weight: 500;
`;

const EditButton = styled.button`
    background: transparent;
    border: 1px solid #FF6B00;
    color: #FF6B00;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;

    &:hover {
        background: rgba(255, 107, 0, 0.1);
        transform: translateY(-2px);
    }
`;

const WayIdContainer = styled.div`
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 215, 0, 0.1));
    border: 1px solid #FF6B00;
    border-radius: 8px;
    padding: 12px 16px;
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const WayIdLabel = styled.span`
    color: #FF6B00;
    font-weight: bold;
    font-size: 14px;
`;

const WayIdValue = styled.span`
    color: #FFD700;
    font-family: 'Orbitron', monospace;
    font-size: 16px;
    letter-spacing: 1px;
`;

const CopyButton = styled.button`
    background: transparent;
    border: 1px solid #FFD700;
    color: #FFD700;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 215, 0, 0.1);
    }
`;

const WalletSection = styled.div`
    background: rgba(26, 26, 26, 0.95);
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;
`;

const WalletTitle = styled.h3`
    color: #FF6B00;
    margin: 0 0 16px;
    font-size: 18px;
`;

const WalletPlaceholder = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
`;

interface UserProfileProps {
    username: string;
    avatarUrl?: string;
    isOnline?: boolean;
    subscriptionType?: 'individual' | 'team';
    wayId?: string;
    stats?: {
        tournaments: number;
        wins: number;
        winRate: number;
    };
    onAvatarUpload?: (file: File) => void;
    onEdit?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
    username,
    avatarUrl,
    isOnline = false,
    subscriptionType,
    wayId: providedWayId,
    stats = { tournaments: 0, wins: 0, winRate: 0 },
    onAvatarUpload,
    onEdit
}) => {
    const [wayId, setWayId] = useState(providedWayId || generateWayId(username));
    const [copied, setCopied] = useState(false);

    const handleAvatarClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && onAvatarUpload) {
                onAvatarUpload(file);
            }
        };
        input.click();
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(wayId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Container>
            <ProfileHeader>
                <AvatarContainer>
                    <ProfileLogo
                        logoUrl={avatarUrl}
                        username={username}
                        size="large"
                        showBorder={true}
                        onClick={handleAvatarClick}
                    />
                    <OnlineStatus isOnline={isOnline} />
                </AvatarContainer>

                <ProfileInfo>
                    <Username>
                        {username}
                        {subscriptionType && (
                            <SubscriptionBadge>
                                {subscriptionType === 'team' ? 'Team' : 'Individual'}
                            </SubscriptionBadge>
                        )}
                    </Username>

                    <Stats>
                        <StatItem>
                            <StatValue>{stats.tournaments}</StatValue>
                            <StatLabel>Tournaments</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{stats.wins}</StatValue>
                            <StatLabel>Wins</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{stats.winRate}%</StatValue>
                            <StatLabel>Win Rate</StatLabel>
                        </StatItem>
                    </Stats>
                </ProfileInfo>

                {onEdit && (
                    <EditButton onClick={onEdit}>
                        Edit Profile
                    </EditButton>
                )}
            </ProfileHeader>

            <ProfileDetails>
                <DetailRow>
                    <DetailLabel>Username</DetailLabel>
                    <DetailValue>@{username.toLowerCase().replace(/\s+/g, '')}</DetailValue>
                </DetailRow>
                <DetailRow>
                    <DetailLabel>Member Since</DetailLabel>
                    <DetailValue>January 2024</DetailValue>
                </DetailRow>
                <DetailRow>
                    <DetailLabel>Status</DetailLabel>
                    <DetailValue>{isOnline ? 'Online' : 'Offline'}</DetailValue>
                </DetailRow>
                <DetailRow>
                    <DetailLabel>Subscription</DetailLabel>
                    <DetailValue>{subscriptionType || 'Free'}</DetailValue>
                </DetailRow>

                <WayIdContainer>
                    <div>
                        <WayIdLabel>WAY ID</WayIdLabel>
                        <WayIdValue>{wayId}</WayIdValue>
                    </div>
                    <CopyButton onClick={copyToClipboard}>
                        {copied ? 'Copied!' : 'Copy'}
                    </CopyButton>
                </WayIdContainer>
            </ProfileDetails>

            <WalletSection>
                <WalletTitle>Wallet</WalletTitle>
                <WalletPlaceholder>
                    Wallet functionality is temporarily disabled
                </WalletPlaceholder>
            </WalletSection>
        </Container>
    );
};

export default UserProfile; 