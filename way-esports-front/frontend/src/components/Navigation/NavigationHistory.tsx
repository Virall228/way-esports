import React from 'react';
import styled from 'styled-components';
import navigationService, { NavigationHistoryItem } from '../../services/NavigationService';

const Container = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
`;

const Title = styled.h3`
  padding: ${({ theme }) => theme.spacing.md};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const List = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const HistoryItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border-left: 4px solid transparent;
  background: ${({ theme, isActive }) => 
    isActive ? `${theme.colors.primary}22` : 'transparent'};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}11`};
  }

  ${({ theme, isActive }) =>
    isActive &&
    `
    border-left-color: ${theme.colors.accent};
  `}

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ItemContent = styled.div`
  flex: 1;
`;

const ItemTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ItemMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
`;

const Tag = styled.span<{ variant?: 'game' | 'category' }>`
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  background: ${({ theme, variant }) =>
    variant === 'game'
      ? `${theme.colors.success}22`
      : variant === 'category'
      ? `${theme.colors.accent}22`
      : `${theme.colors.primary}22`};
  color: ${({ theme, variant }) =>
    variant === 'game'
      ? theme.colors.success
      : variant === 'category'
      ? theme.colors.accent
      : theme.colors.text.secondary};
`;

const TimeAgo = styled.span`
  color: ${({ theme }) => theme.colors.text.disabled};
`;

interface NavigationHistoryProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const NavigationHistory: React.FC<NavigationHistoryProps> = ({
  className,
  onNavigate
}) => {
  const history = navigationService.getNavigationHistory();
  const currentPath = window.location.pathname;

  const handleClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigationService.handleNavigation(path);
    }
  };

  if (history.length === 0) return null;

  return (
    <Container className={className}>
      <Title>Navigation History</Title>
      <List>
        {history.map((item: NavigationHistoryItem) => (
          <HistoryItem
            key={`${item.path}-${item.timestamp}`}
            onClick={() => handleClick(item.path)}
            isActive={item.path === currentPath}
          >
            <ItemContent>
              <ItemTitle>{item.title}</ItemTitle>
              <ItemMeta>
                {item.game && <Tag variant="game">{item.game}</Tag>}
                {item.category && (
                  <Tag variant="category">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Tag>
                )}
                <TimeAgo>{formatTimeAgo(item.timestamp)}</TimeAgo>
              </ItemMeta>
            </ItemContent>
          </HistoryItem>
        ))}
      </List>
    </Container>
  );
};

export default NavigationHistory; 