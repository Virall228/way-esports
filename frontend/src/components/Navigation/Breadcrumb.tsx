import React from 'react';
import styled from 'styled-components';
import navigationService, { BreadcrumbItem } from '../../services/NavigationService';

const Container = styled.nav`
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
`;

const List = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:last-child {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 500;
  }
`;

const Separator = styled.span`
  color: ${({ theme }) => theme.colors.text.disabled};
`;

const Link = styled.a`
  color: inherit;
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

interface BreadcrumbProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className, onNavigate }) => {
  const breadcrumbs = navigationService.getBreadcrumbs();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigationService.handleNavigation(path);
    }
  };

  if (breadcrumbs.length <= 1) return null;

  return (
    <Container className={className}>
      <List>
        {breadcrumbs.map((crumb: BreadcrumbItem, index: number) => (
          <Item key={crumb.path}>
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link href={crumb.path} onClick={(e) => handleClick(e, crumb.path)}>
                  {crumb.title}
                </Link>
                <Separator>/</Separator>
              </>
            ) : (
              <span>{crumb.title}</span>
            )}
          </Item>
        ))}
      </List>
    </Container>
  );
};

export default Breadcrumb; 