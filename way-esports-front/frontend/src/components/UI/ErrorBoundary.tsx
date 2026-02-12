import { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  color: #ffffff;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #ff4757;
`;

const ErrorTitle = styled.h1`
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #ff6b00;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const ErrorMessage = styled.p`
  font-family: 'Exo 2', sans-serif;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: #cccccc;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  margin-bottom: 2rem;
  text-align: left;
  width: 100%;
`;

const ErrorSummary = styled.summary`
  font-family: 'Orbitron', monospace;
  font-weight: 600;
  color: #ff6b00;
  cursor: pointer;
  padding: 0.5rem;
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 1rem;
  
  &:hover {
    background: rgba(255, 107, 0, 0.1);
  }
`;

const ErrorStack = styled.pre`
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Chakra Petch', monospace;
  font-size: 0.9rem;
  color: #ff6b6b;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  font-family: 'Orbitron', monospace;
  font-weight: 600;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  
  ${({ variant = 'primary' }) => 
    variant === 'primary' 
      ? `
        background: linear-gradient(135deg, #ff6b00, #ff4757);
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 0, 0.4);
        }
      `
      : `
        background: transparent;
        color: #ff6b00;
        border: 2px solid #ff6b00;
        
        &:hover {
          background: rgba(255, 107, 0, 0.1);
        }
      `
  }
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (import.meta.env.PROD) {
      // Example: send to error reporting service
      // errorReportingService.captureException(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearCache = () => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Reload page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorContainer>
          <ErrorIcon>{'\u26A0'}</ErrorIcon>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
          </ErrorMessage>

          <ErrorDetails>
            <ErrorSummary>Technical Details</ErrorSummary>
            <ErrorStack>
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </ErrorStack>
          </ErrorDetails>

          <ButtonGroup>
            <Button onClick={this.handleReload}>
              {'\u{1F504}'} Reload Page
            </Button>
            <Button variant="secondary" onClick={this.handleGoHome}>
              {'\u{1F3E0}'} Go Home
            </Button>
            <Button variant="secondary" onClick={this.handleClearCache}>
              {'\u{1F5D1}'} Clear Cache
            </Button>
          </ButtonGroup>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
