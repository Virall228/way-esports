import React, { useState } from 'react';
import styled from 'styled-components';

const ProfileContainer = styled.div`
    padding-bottom: 80px;
`;

const ProfileCard = styled.div`
    background-color: #2a2a2a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const ProfileHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 20px;
`;

const ProfilePicture = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-right: 15px;
    object-fit: cover;
    border: 2px solid #FF6B00;
`;

const ProfileInfo = styled.div`
    flex-grow: 1;
`;

const Username = styled.h2`
    margin: 0;
    color: #FF6B00;
`;

const Nickname = styled.p`
    margin: 5px 0;
    color: #999;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 20px 0;
`;

const StatBox = styled.div`
    background-color: #333;
    padding: 15px;
    border-radius: 8px;
    text-align: center;

    h3 {
        margin: 0;
        color: #FF6B00;
        font-size: 24px;
    }

    p {
        margin: 5px 0 0;
        color: #999;
        font-size: 14px;
    }
`;

const Achievements = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
`;

const Achievement = styled.div`
    background-color: #333;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    color: #FF6B00;
    border: 1px solid #FF6B00;
`;

const EditButton = styled.button`
    background-color: #FF6B00;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 20px;
    width: 100%;
    font-size: 16px;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #ff8533;
    }
`;

interface ProfileProps {
    user: {
        id: string;
        username: string;
        nickname?: string;
        photoUrl?: string;
        stats: {
            wins: number;
            losses: number;
            tournaments: number;
        };
        achievements: string[];
    };
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <ProfileContainer>
            <ProfileCard>
                <ProfileHeader>
                    <ProfilePicture 
                        src={user.photoUrl || 'https://via.placeholder.com/80'} 
                        alt={user.username} 
                    />
                    <ProfileInfo>
                        <Username>{user.username}</Username>
                        <Nickname>{user.nickname || 'No nickname set'}</Nickname>
                    </ProfileInfo>
                </ProfileHeader>

                <StatsGrid>
                    <StatBox>
                        <h3>{user.stats.wins}</h3>
                        <p>Wins</p>
                    </StatBox>
                    <StatBox>
                        <h3>{user.stats.losses}</h3>
                        <p>Losses</p>
                    </StatBox>
                    <StatBox>
                        <h3>{user.stats.tournaments}</h3>
                        <p>Tournaments</p>
                    </StatBox>
                </StatsGrid>

                <Achievements>
                    {user.achievements.map((achievement, index) => (
                        <Achievement key={index}>
                            {achievement}
                        </Achievement>
                    ))}
                </Achievements>

                <EditButton onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Save Profile' : 'Edit Profile'}
                </EditButton>
            </ProfileCard>
        </ProfileContainer>
    );
};

export default Profile; 