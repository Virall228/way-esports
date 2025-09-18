import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import theme from '../../../styles/theme';
import NewsPage from '../NewsPage';

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('NewsPage', () => {
  it('renders the page title', () => {
    renderWithTheme(<NewsPage />);
    expect(screen.getByText('Latest News')).toBeInTheDocument();
  });

  it('renders all news articles', () => {
    renderWithTheme(<NewsPage />);
    
    // Check for article titles
    expect(screen.getByText('WAY Esports expands into CS2 with new roster')).toBeInTheDocument();
    expect(screen.getByText('Critical Ops Pro League Season 5 announced')).toBeInTheDocument();
    expect(screen.getByText('WAY Tigers dominate PUBG Mobile tournament')).toBeInTheDocument();
    
    // Check for article dates
    expect(screen.getByText('March 10, 2024')).toBeInTheDocument();
    expect(screen.getByText('March 8, 2024')).toBeInTheDocument();
    expect(screen.getByText('March 5, 2024')).toBeInTheDocument();
  });

  it('renders news article images with correct alt text', () => {
    renderWithTheme(<NewsPage />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    
    images.forEach((img) => {
      expect(img).toHaveAttribute('src');
      expect(img).toHaveAttribute('alt');
    });
  });
}); 