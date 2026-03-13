export type HistorySort = 'recent' | 'oldest';

export type HistoryPaginationModel = {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export type HistoryRowModel = {
  key: string;
  title: string;
  subtitle: string;
  rightText?: string;
  rightColor?: string;
  to?: string;
};

