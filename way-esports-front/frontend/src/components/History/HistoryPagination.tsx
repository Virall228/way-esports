import React from 'react';
import Button from '../UI/Button';
import type { HistoryPaginationModel } from './types';

type Props = HistoryPaginationModel;

const HistoryPagination: React.FC<Props> = ({ page, totalPages, loading, onPrev, onNext }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
      <Button size="small" variant="outline" disabled={page <= 1 || loading} onClick={onPrev}>
        Prev
      </Button>
      <span style={{ color: '#c9c9c9', fontSize: '0.9rem' }}>
        Page {page} / {totalPages}
      </span>
      <Button size="small" variant="outline" disabled={page >= totalPages || loading} onClick={onNext}>
        Next
      </Button>
    </div>
  );
};

export default HistoryPagination;
