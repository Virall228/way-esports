import '@testing-library/jest-dom';
import 'jest-styled-components';
import 'jest-environment-jsdom';

// Mock Telegram WebApp
window.Telegram = {
    WebApp: {
        ready: jest.fn(),
        expand: jest.fn(),
        initDataUnsafe: {
            user: {
                id: 12345,
                username: 'testuser',
                photo_url: 'https://example.com/photo.jpg'
            }
        }
    }
};

// Mock IntersectionObserver
class IntersectionObserver {
    observe = jest.fn();
    disconnect = jest.fn();
    unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserver
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
}); 