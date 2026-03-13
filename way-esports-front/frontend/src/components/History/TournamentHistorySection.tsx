import React from 'react';
import Card from '../UI/Card';
import TournamentHistoryRow from './TournamentHistoryRow';
import HistoryPagination from './HistoryPagination';
import type { HistoryPaginationModel, HistoryRowModel } from './types';

type Props = {
  title?: React.ReactNode;
  controls?: React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  items: HistoryRowModel[];
  pagination?: HistoryPaginationModel;
  summaryText?: React.ReactNode;
};

const TournamentHistorySection: React.FC<Props> = ({
  title,
  controls,
  loading,
  emptyText = 'No data',
  items,
  pagination,
  summaryText
}) => {
  return (
    <>
      {title ? <h3>{title}</h3> : null}
      <Card style={{ padding: '1rem' }}>
        {controls ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>{controls}</div> : null}
        {loading ? (
          <div style={{ opacity: 0.75 }}>Loading history...</div>
        ) : items.length === 0 ? (
          <div style={{ opacity: 0.75 }}>{emptyText}</div>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.key} style={{ marginBottom: 8 }}>
                <TournamentHistoryRow
                  title={item.title}
                  subtitle={item.subtitle}
                  rightText={item.rightText}
                  rightColor={item.rightColor}
                  to={item.to}
                />
              </div>
            ))}
          </>
        )}

        {summaryText ? <div style={{ marginTop: 12, color: '#cfcfcf', fontSize: '0.9rem' }}>{summaryText}</div> : null}

        {pagination ? (
          <HistoryPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            loading={pagination.loading}
            onPrev={pagination.onPrev}
            onNext={pagination.onNext}
          />
        ) : null}
      </Card>
    </>
  );
};

export default TournamentHistorySection;
