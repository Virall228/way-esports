import React from 'react';
import styled from 'styled-components';
import { SwissStanding } from '../../types/match';

interface SwissStandingsTableProps {
  standings: SwissStanding[];
  qualificationSpots: number;
  eliminationThreshold: number;
}

const Container = styled.div`
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 107, 0, 0.2);
  overflow-x: auto;
`;

const Title = styled.h3`
  color: #ffffff;
  margin: 0 0 20px 0;
  font-size: 20px;
  background: linear-gradient(135deg, #c0c0c0, #808080);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const TableHeader = styled.thead`
  background: rgba(255, 107, 0, 0.1);
`;

const HeaderRow = styled.tr`
  border-bottom: 2px solid rgba(255, 107, 0, 0.3);
`;

const HeaderCell = styled.th`
  color: #ffffff;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:first-child {
    border-radius: 8px 0 0 8px;
  }
  
  &:last-child {
    border-radius: 0 8px 8px 0;
  }
`;

const TableBody = styled.tbody``;

const DataRow = styled.tr<{ $status: 'qualified' | 'eliminated' | 'active' }>`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  background: ${({ $status }) => 
    $status === 'qualified' ? 'rgba(46, 213, 115, 0.1)' :
    $status === 'eliminated' ? 'rgba(255, 71, 87, 0.1)' :
    'transparent'};

  &:hover {
    background: ${({ $status }) => 
      $status === 'qualified' ? 'rgba(46, 213, 115, 0.15)' :
      $status === 'eliminated' ? 'rgba(255, 71, 87, 0.15)' :
      'rgba(255, 255, 255, 0.05)'};
  }
`;

const DataCell = styled.td`
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  vertical-align: middle;
`;

const Position = styled.div<{ $status: 'qualified' | 'eliminated' | 'active' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $status }) => 
      $status === 'qualified' ? '#2ed573' :
      $status === 'eliminated' ? '#ff4757' :
      '#c0c0c0'};
  }
`;

const ParticipantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ParticipantName = styled.div`
  font-weight: 600;
  color: #ffffff;
`;

const ParticipantTag = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

const Record = styled.div<{ $wins: number; $losses: number }>`
  font-weight: 600;
  color: ${({ $wins, $losses }) => 
    $wins > $losses ? '#2ed573' :
    $wins < $losses ? '#ff4757' :
    '#ffd700'};
`;

const Buchholz = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
`;

const StatusBadge = styled.div<{ $status: 'qualified' | 'eliminated' | 'active' }>`
  background: ${({ $status }) => 
    $status === 'qualified' ? 'linear-gradient(135deg, #2ed573, #3ddb7f)' :
    $status === 'eliminated' ? 'linear-gradient(135deg, #ff4757, #ff6b7a)' :
    'linear-gradient(135deg, #c0c0c0, #808080)'};
  color: ${({ $status }) => $status === 'active' ? '#000000' : '#ffffff'};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  min-width: 70px;
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

const LegendDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.7);
`;

const SwissStandingsTable: React.FC<SwissStandingsTableProps> = ({
  standings,
  qualificationSpots,
  eliminationThreshold
}) => {
  if (!standings || standings.length === 0) {
    return (
      <Container>
        <Title>Swiss Standings</Title>
        <EmptyState>
          No standings data available
        </EmptyState>
      </Container>
    );
  }

  // Сортируем участников по результатам
  const sortedStandings = [...standings].sort((a, b) => {
    // Сначала по количеству побед (больше лучше)
    if (a.wins !== b.wins) return b.wins - a.wins;
    
    // Затем по количеству поражений (меньше лучше)
    if (a.losses !== b.losses) return a.losses - b.losses;
    
    // Затем по Buchholz (больше лучше)
    return b.buchholz - a.buchholz;
  });

  const getParticipantStatus = (standing: SwissStanding, position: number): 'qualified' | 'eliminated' | 'active' => {
    if (standing.isQualified || position <= qualificationSpots) return 'qualified';
    if (standing.isEliminated || standing.losses >= eliminationThreshold) return 'eliminated';
    return 'active';
  };

  const getParticipantName = (standing: SwissStanding): string => {
    if ('name' in standing.participant) {
      return standing.participant.name;
    }
    return standing.participant.username;
  };

  const getParticipantTag = (standing: SwissStanding): string => {
    if ('tag' in standing.participant) {
      return standing.participant.tag;
    }
    return 'Solo';
  };

  const getStatusText = (status: 'qualified' | 'eliminated' | 'active'): string => {
    switch (status) {
      case 'qualified': return 'Qualified';
      case 'eliminated': return 'Eliminated';
      case 'active': return 'Active';
    }
  };

  return (
    <Container>
      <Title>Swiss Standings</Title>
      
      <Table>
        <TableHeader>
          <HeaderRow>
            <HeaderCell>Position</HeaderCell>
            <HeaderCell>Participant</HeaderCell>
            <HeaderCell>Record</HeaderCell>
            <HeaderCell>Buchholz</HeaderCell>
            <HeaderCell>Status</HeaderCell>
          </HeaderRow>
        </TableHeader>
        
        <TableBody>
          {sortedStandings.map((standing, index) => {
            const position = index + 1;
            const status = getParticipantStatus(standing, position);
            
            return (
              <DataRow key={standing.participantId} $status={status}>
                <DataCell>
                  <Position $status={status}>
                    {position}
                  </Position>
                </DataCell>
                
                <DataCell>
                  <ParticipantInfo>
                    <ParticipantName>{getParticipantName(standing)}</ParticipantName>
                    <ParticipantTag>#{getParticipantTag(standing)}</ParticipantTag>
                  </ParticipantInfo>
                </DataCell>
                
                <DataCell>
                  <Record $wins={standing.wins} $losses={standing.losses}>
                    {standing.wins}W - {standing.losses}L
                  </Record>
                </DataCell>
                
                <DataCell>
                  <Buchholz>{standing.buchholz.toFixed(1)}</Buchholz>
                </DataCell>
                
                <DataCell>
                  <StatusBadge $status={status}>
                    {getStatusText(status)}
                  </StatusBadge>
                </DataCell>
              </DataRow>
            );
          })}
        </TableBody>
      </Table>

      <Legend>
        <LegendItem>
          <LegendDot $color="#2ed573" />
          Qualified for Playoffs
        </LegendItem>
        <LegendItem>
          <LegendDot $color="#ff4757" />
          Eliminated
        </LegendItem>
        <LegendItem>
          <LegendDot $color="#c0c0c0" />
          Still Active
        </LegendItem>
      </Legend>
    </Container>
  );
};

export default SwissStandingsTable;