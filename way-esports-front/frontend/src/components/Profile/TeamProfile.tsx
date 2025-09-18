import React from 'react';
import styled from 'styled-components';
import UserProfile from './UserProfile';

const Container = styled.div`
    padding: 24px;
    background: rgba(26, 26, 26, 0.95);
    border-radius: 16px;
    margin-bottom: 32px;
`;

const TeamHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;
`;

const TeamLogo = styled.div<{ color: string }>`
    width: 120px;
    height: 120px;
    border-radius: 16px;
    background: ${props => `linear-gradient(135deg, ${props.color}22, ${props.color}44)`};
    border: 2px solid ${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
    color: ${props => props.color};
`;

const TeamInfo = styled.div`
    flex: 1;
`;

const TeamName = styled.h2`
    color: #fff;
    margin: 0 0 8px;
    font-size: 32px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const TeamTag = styled.span<{ color: string }>`
    background: ${props => props.color};
    color: #000;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
`;

const TeamStats = styled.div`
    display: flex;
    gap: 32px;
    margin-top: 16px;
`;

const StatItem = styled.div`
    text-align: center;
`;

const StatValue = styled.div`
    color: #FFD700;
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 4px;
`;

const StatLabel = styled.div`
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
`;

const MembersSection = styled.div`
    margin-top: 32px;
`;

const MembersTitle = styled.h3`
    color: #fff;
    margin: 0 0 24px;
    font-size: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const MemberCount = styled.span`
    color: #FF6B00;
    font-size: 18px;
`;

const MembersGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
`;

const MemberCard = styled.div`
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 107, 0, 0.3);
`;

interface TeamMember {
    username: string;
    wayId: string;
    avatarUrl?: string;
    role: 'captain' | 'member';
    isOnline: boolean;
}

interface Team {
    name: string;
    tag: string;
    color: string;
    members: TeamMember[];
    stats: {
        tournaments: number;
        wins: number;
        winRate: number;
    };
}

interface TeamProfileProps {
    team: Team;
}

const TeamProfile: React.FC<TeamProfileProps> = ({ team }) => {
    return (
        <Container>
            <TeamHeader>
                <TeamLogo color={team.color}>
                    {team.tag}
                </TeamLogo>
                <TeamInfo>
                    <TeamName>
                        {team.name}
                        <TeamTag color={team.color}>{team.tag}</TeamTag>
                    </TeamName>
                    <TeamStats>
                        <StatItem>
                            <StatValue>{team.stats.tournaments}</StatValue>
                            <StatLabel>Tournaments</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{team.stats.wins}</StatValue>
                            <StatLabel>Wins</StatLabel>
                        </StatItem>
                        <StatItem>
                            <StatValue>{team.stats.winRate}%</StatValue>
                            <StatLabel>Win Rate</StatLabel>
                        </StatItem>
                    </TeamStats>
                </TeamInfo>
            </TeamHeader>

            <MembersSection>
                <MembersTitle>
                    Team Members
                    <MemberCount>({team.members.length}/5)</MemberCount>
                </MembersTitle>
                <MembersGrid>
                    {team.members.map((member) => (
                        <MemberCard key={member.wayId}>
                            <UserProfile
                                username={member.username}
                                wayId={member.wayId}
                                avatarUrl={member.avatarUrl}
                                isOnline={member.isOnline}
                                subscriptionType="team"
                            />
                        </MemberCard>
                    ))}
                </MembersGrid>
            </MembersSection>
        </Container>
    );
};

export default TeamProfile; 