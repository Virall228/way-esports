import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { api } from '../../services/api';

type SearchItemType = 'player' | 'team' | 'tournament' | 'news';

export interface SearchResult {
  id: string;
  type: SearchItemType;
  name: string;
  avatar?: string;
  details?: string;
  tag?: string;
  game?: string;
  status?: string;
  relevance?: number;
}

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  padding-left: 50px;
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
  border: 2px solid rgba(255, 107, 0, 0.3);
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ff6b00;
    box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
    background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    padding: 14px 16px;
    padding-left: 45px;
    font-size: 16px;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #ff6b00;
  font-size: 20px;
  pointer-events: none;
  z-index: 2;

  @media (max-width: 768px) {
    left: 12px;
    font-size: 18px;
  }
`;

const SearchResults = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border: 2px solid rgba(255, 107, 0, 0.3);
  border-top: none;
  border-radius: 0 0 12px 12px;
  backdrop-filter: blur(10px);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  opacity: ${({ $isVisible }) => $isVisible ? 1 : 0};
  visibility: ${({ $isVisible }) => $isVisible ? 'visible' : 'hidden'};
  transform: translateY(${({ $isVisible }) => $isVisible ? '0' : '-10px'});
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #ff6b00, #ffd700);
    border-radius: 3px;
  }
`;

const SearchCategory = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CategoryTitle = styled.div`
  color: #ff6b00;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CategoryCount = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
`;

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 8px;

  &:hover {
    background: rgba(255, 107, 0, 0.1);
    transform: translateX(4px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ResultAvatar = styled.div<{ $imageUrl?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $imageUrl }) => $imageUrl ? `url(${$imageUrl})` : 'linear-gradient(135deg, #ff6b00, #ffd700)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  border: 2px solid rgba(255, 107, 0, 0.3);
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultName = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultDetails = styled.div`
  color: #cccccc;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ResultType = styled.div<{ $type: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $type }) => 
    $type === 'player' ? 'rgba(46, 213, 115, 0.2)' :
    $type === 'team' ? 'rgba(255, 107, 0, 0.2)' :
    $type === 'news' ? 'rgba(255, 215, 0, 0.2)' :
    'rgba(255, 215, 0, 0.2)'};
  color: ${({ $type }) => 
    $type === 'player' ? '#2ed573' :
    $type === 'team' ? '#ff6b00' :
    $type === 'news' ? '#ffd700' :
    '#ffd700'};
  border: 1px solid ${({ $type }) => 
    $type === 'player' ? 'rgba(46, 213, 115, 0.3)' :
    $type === 'team' ? 'rgba(255, 107, 0, 0.3)' :
    $type === 'news' ? 'rgba(255, 215, 0, 0.3)' :
    'rgba(255, 215, 0, 0.3)'};
`;

const NoResults = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: #cccccc;
  font-size: 14px;
`;

const LoadingSpinner = styled.div`
  padding: 20px;
  text-align: center;
  color: #ff6b00;
  font-size: 14px;

  &::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 107, 0, 0.3);
    border-top: 2px solid #ff6b00;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 16px;
  padding-top: 12px;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${({ $active }) => $active ? '#ff6b00' : 'rgba(255, 255, 255, 0.2)'};
  background: ${({ $active }) => $active ? 'rgba(255, 107, 0, 0.2)' : 'transparent'};
  color: ${({ $active }) => $active ? '#ff6b00' : '#cccccc'};

  &:hover {
    border-color: #ff6b00;
    color: #ff6b00;
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 13px;
  }
`;

interface SearchComponentProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ 
  onResultSelect, 
  placeholder = "Search players, teams, tournaments...",
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'players' | 'teams' | 'tournaments'>('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q) {
        if (!mounted) return;
        setResults([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const res: any = await api.get(`/api/search?q=${encodeURIComponent(q)}&limit=20`);
        const data = (res && res.data) || {};

        const flat: SearchResult[] = [
          ...((data.players || []) as any[]),
          ...((data.teams || []) as any[]),
          ...((data.tournaments || []) as any[]),
          ...((data.news || []) as any[])
        ].map((x: any) => ({
          id: String(x.id || x._id || ''),
          type: x.type,
          name: x.name,
          avatar: x.avatar,
          details: x.details,
          tag: x.tag,
          game: x.game,
          status: x.status,
          relevance: x.relevance
        }));

        if (!mounted) return;
        setResults(flat);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Search failed');
        setResults([]);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setQuery('');
    setIsVisible(false);
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0) {
      setIsVisible(true);
    }
  };

  const handleFilterChange = (filter: 'all' | 'players' | 'teams' | 'tournaments') => {
    setActiveFilter(filter);
  };

  const groupedResults = {
    players: results.filter((r) => r.type === 'player'),
    teams: results.filter((r) => r.type === 'team'),
    tournaments: results.filter((r) => r.type === 'tournament'),
    news: results.filter((r) => r.type === 'news')
  };

  const totalCount = results.length;

  return (
    <SearchContainer ref={searchRef} className={className}>
      <SearchIcon>{'\u{1F50D}'}</SearchIcon>

      <SearchInput
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleInputFocus}
        className="touch-target"
      />
      
      <SearchResults $isVisible={isVisible}>
        <FilterTabs>
          <FilterTab 
            $active={activeFilter === 'all'} 
            onClick={() => handleFilterChange('all')}
          >
            All ({totalCount})
          </FilterTab>

          <FilterTab 
            $active={activeFilter === 'players'} 
            onClick={() => handleFilterChange('players')}
          >
            Players ({groupedResults.players.length})
          </FilterTab>
          <FilterTab 
            $active={activeFilter === 'teams'} 
            onClick={() => handleFilterChange('teams')}
          >
            Teams ({groupedResults.teams.length})
          </FilterTab>
          <FilterTab 
            $active={activeFilter === 'tournaments'} 
            onClick={() => handleFilterChange('tournaments')}
          >
            Tournaments ({groupedResults.tournaments.length})
          </FilterTab>
        </FilterTabs>

        {isLoading ? (
          <LoadingSpinner>Searching...</LoadingSpinner>
        ) : error ? (
          <NoResults>{error}</NoResults>
        ) : results.length === 0 && query.trim().length > 0 ? (
          <NoResults>
            No results found for "{query}"
          </NoResults>
        ) : (
          <>
            {activeFilter === 'all' || activeFilter === 'players' ? (
              groupedResults.players.length > 0 && (
                <SearchCategory>
                  <CategoryTitle>
                    Players
                    <CategoryCount>{groupedResults.players.length}</CategoryCount>
                  </CategoryTitle>
                  {groupedResults.players.map(result => (
                    <SearchResultItem key={result.id} onClick={() => handleResultClick(result)}>
                      <ResultAvatar $imageUrl={result.avatar}>{result.avatar}</ResultAvatar>
                      <ResultInfo>
                        <ResultName>{result.name}</ResultName>
                        <ResultDetails>{result.details}</ResultDetails>
                      </ResultInfo>
                      <ResultType $type={result.type}>Player</ResultType>
                    </SearchResultItem>
                  ))}
                </SearchCategory>
              )
            ) : null}

            {activeFilter === 'all' || activeFilter === 'teams' ? (
              groupedResults.teams.length > 0 && (
                <SearchCategory>
                  <CategoryTitle>
                    Teams
                    <CategoryCount>{groupedResults.teams.length}</CategoryCount>
                  </CategoryTitle>
                  {groupedResults.teams.map(result => (
                    <SearchResultItem key={result.id} onClick={() => handleResultClick(result)}>
                      <ResultAvatar $imageUrl={result.avatar}>{result.avatar}</ResultAvatar>
                      <ResultInfo>
                        <ResultName>{result.name}</ResultName>
                        <ResultDetails>{result.details}</ResultDetails>
                      </ResultInfo>
                      <ResultType $type={result.type}>Team</ResultType>
                    </SearchResultItem>
                  ))}
                </SearchCategory>
              )
            ) : null}

            {activeFilter === 'all' || activeFilter === 'tournaments' ? (
              groupedResults.tournaments.length > 0 && (
                <SearchCategory>
                  <CategoryTitle>
                    Tournaments
                    <CategoryCount>{groupedResults.tournaments.length}</CategoryCount>
                  </CategoryTitle>
                  {groupedResults.tournaments.map(result => (
                    <SearchResultItem key={result.id} onClick={() => handleResultClick(result)}>
                      <ResultAvatar $imageUrl={result.avatar}>{result.avatar}</ResultAvatar>
                      <ResultInfo>
                        <ResultName>{result.name}</ResultName>
                        <ResultDetails>{result.details}</ResultDetails>
                      </ResultInfo>
                      <ResultType $type={result.type}>Tournament</ResultType>
                    </SearchResultItem>
                  ))}
                </SearchCategory>
              )
            ) : null}

            {activeFilter === 'all' ? (
              groupedResults.news.length > 0 && (
                <SearchCategory>
                  <CategoryTitle>
                    News
                    <CategoryCount>{groupedResults.news.length}</CategoryCount>
                  </CategoryTitle>
                  {groupedResults.news.map(result => (
                    <SearchResultItem key={result.id} onClick={() => handleResultClick(result)}>
                      <ResultAvatar $imageUrl={result.avatar}>{result.avatar}</ResultAvatar>
                      <ResultInfo>
                        <ResultName>{result.name}</ResultName>
                        <ResultDetails>{result.details}</ResultDetails>
                      </ResultInfo>
                      <ResultType $type={result.type}>News</ResultType>
                    </SearchResultItem>
                  ))}
                </SearchCategory>
              )
            ) : null}
          </>
        )}
      </SearchResults>
    </SearchContainer>
  );
};

export default SearchComponent;
