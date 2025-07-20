import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { NewsCard } from '../';

const mockProps = {
    title: 'Test News Title',
    date: '2024-03-15',
    category: 'Test Category',
    preview: 'Test preview text',
    imageUrl: 'https://example.com/image.jpg',
    onClick: jest.fn()
};

const renderNewsCard = (props = mockProps) => {
    return render(
        <LanguageProvider>
            <NewsCard {...props} />
        </LanguageProvider>
    );
};

describe('NewsCard', () => {
    it('renders all provided content correctly', () => {
        renderNewsCard();

        expect(screen.getByText(mockProps.title)).toBeInTheDocument();
        expect(screen.getByText(mockProps.category)).toBeInTheDocument();
        expect(screen.getByText(mockProps.preview)).toBeInTheDocument();
        
        const image = screen.getByAltText(mockProps.title) as HTMLImageElement;
        expect(image.src).toBe(mockProps.imageUrl);
    });

    it('formats date correctly', () => {
        renderNewsCard();
        
        const formattedDate = new Date(mockProps.date).toLocaleDateString();
        expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('calls onClick handler when clicked', () => {
        renderNewsCard();
        
        fireEvent.click(screen.getByText(mockProps.title));
        expect(mockProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('renders without image when imageUrl is not provided', () => {
        const propsWithoutImage = { ...mockProps, imageUrl: undefined };
        renderNewsCard(propsWithoutImage);
        
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('applies hover styles correctly', () => {
        const { container } = renderNewsCard();
        const card = container.firstChild;
        
        expect(card).toHaveStyleRule('transform', 'translateY(-5px)', {
            modifier: ':hover'
        });
    });
}); 