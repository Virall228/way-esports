import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileLogo from '../components/UI/ProfileLogo';

describe('ProfileLogo Component', () => {
  const defaultProps = {
    username: 'TestUser',
    logoUrl: undefined,
    size: 'medium' as const,
    showBorder: true,
    onClick: undefined,
  };

  it('renders with default avatar when no logo is provided', () => {
    render(<ProfileLogo {...defaultProps} />);
    expect(screen.getByText('\u{1F464}')).toBeInTheDocument();
  });

  it('renders with logo when logoUrl is provided', () => {
    const logoUrl = 'https://example.com/logo.png';
    render(<ProfileLogo {...defaultProps} logoUrl={logoUrl} />);
    
    const img = screen.getByAltText("TestUser's profile logo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', logoUrl);
  });

  it('calls onClick when clicked and onClick is provided', () => {
    const mockOnClick = jest.fn();
    render(<ProfileLogo {...defaultProps} onClick={mockOnClick} />);
    
    const container = screen.getByText('\u{1F464}').parentElement;
    fireEvent.click(container!);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when clicked but onClick is not provided', () => {
    render(<ProfileLogo {...defaultProps} />);
    
    const container = screen.getByText('\u{1F464}').parentElement;
    fireEvent.click(container!);
    
    // Should not throw any errors
    expect(container).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<ProfileLogo {...defaultProps} size="small" />);
    let container = screen.getByText('\u{1F464}').parentElement;
    expect(container).toHaveStyle({ width: '32px', height: '32px' });

    rerender(<ProfileLogo {...defaultProps} size="large" />);
    container = screen.getByText('\u{1F464}').parentElement;
    expect(container).toHaveStyle({ width: '80px', height: '80px' });
  });

  it('shows border when showBorder is true', () => {
    render(<ProfileLogo {...defaultProps} showBorder={true} />);
    const container = screen.getByText('\u{1F464}').parentElement;
    expect(container).toHaveStyle({ border: '2px solid #ff6b00' });
  });

  it('hides border when showBorder is false', () => {
    render(<ProfileLogo {...defaultProps} showBorder={false} />);
    const container = screen.getByText('\u{1F464}').parentElement;
    expect(container).toHaveStyle({ border: 'none' });
  });
}); 
