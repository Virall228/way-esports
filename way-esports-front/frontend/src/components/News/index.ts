export { default as NewsCard } from './NewsCard';
export { default as NewsPage } from './NewsPage';
export { default as NewsDetail } from './NewsDetail';

// Types
export interface NewsItem {
    id: string;
    title: string;
    date: string;
    category: string;
    preview: string;
    imageUrl?: string;
    content: string;
}

export interface NewsCardProps {
    title: string;
    date: string;
    category: string;
    preview: string;
    imageUrl?: string;
    onClick: () => void;
} 