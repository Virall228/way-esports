import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSearch, SearchResult, SearchFilters } from '../../hooks/useSearch';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
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
    'rgba(255, 215, 0, 0.2)'};
  color: ${({ $type }) => 
    $type === 'player' ? '#2ed573' :
    $type === 'team' ? '#ff6b00' :
    '#ffd700'};
  border: 1px solid ${({ $type }) => 
    $type === 'player' ? 'rgba(46, 213, 115, 0.3)' :
    $type === 'team' ? 'rgba(255, 107, 0, 0.3)' :
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

const Suggestions = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  color: #cccccc;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 107, 0, 0.1);
    color: #ff6b00;
  }
`;

interface SearchComponentProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  initialFilters?: SearchFilters;
}

// Mock data for search
const mockSearchData: SearchResult[] = [
  // Players
  { id: '1', type: 'player', name: 'WAY.Striker', avatar: '👤', details: 'WAY Esports • K/D: 2.45', tag: 'WAY', game: 'Critical Ops', relevance: 100, lastUpdated: new Date() },
  { id: '2', type: 'player', name: 'Phoenix_Flame', avatar: '👤', details: 'Phoenix Rising • K/D: 2.72', tag: 'PHX', game: 'CS2', relevance: 95, lastUpdated: new Date() },
  { id: '3', type: 'player', name: 'Shadow_Stalker', avatar: '👤', details: 'Shadow Hunters • K/D: 2.68', tag: 'SH', game: 'PUBG Mobile', relevance: 90, lastUpdated: new Date() },
  
  // Teams
  { id: '4', type: 'team', name: 'WAY Tigers', avatar: '🐯', details: 'Critical Ops • 5 members', tag: 'WAY', game: 'Critical Ops', status: 'active', relevance: 100, lastUpdated: new Date() },
  { id: '5', type: 'team', name: 'Phoenix Rising', avatar: '🔥', details: 'CS2 • 4 members', tag: 'PHX', game: 'CS2', status: 'recruiting', relevance: 95, lastUpdated: new Date() },
  { id: '6', type: 'team', name: 'Shadow Hunters', avatar: '🌙', details: 'PUBG Mobile • 5 members', tag: 'SH', game: 'PUBG Mobile', status: 'active', relevance: 90, lastUpdated: new Date() },
  
  // Tournaments
  { id: '7', type: 'tournament', name: 'CS2 Pro League Season 1', avatar: '🏆', details: 'Prize Pool: $1,000 • 16 teams', status: 'registering', relevance: 100, lastUpdated: new Date() },
  { id: '8', type: 'tournament', name: 'Critical Ops Championship', avatar: '🏆', details: 'Prize Pool: $500 • 8 teams', status: 'upcoming', relevance: 95, lastUpdated: new Date() },
  { id: '9', type: 'tournament', name: 'PUBG Mobile Masters', avatar: '🏆', details: 'Prize Pool: $750 • 12 teams', status: 'live', relevance: 90, lastUpdated: new Date() }
];

const SearchComponent: React.FC<SearchComponentProps> = ({ 
  onResultSelect, 
  placeholder = "Search players, teams, tournaments...",
  className,
  initialFilters = { type: 'all' }
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'players' | 'teams' | 'tournaments'>('all');
  const searchRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    groupedResults,
    suggestions,
    hasResults,
    totalCount
  } = useSearch(mockSearchData, {
    debounceMs: 300,
    maxResults: 20,
    enableCache: true,
    cacheExpiryMs: 5 * 60 * 1000
  });

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

    setIsVisible(hasResults || suggestions.length > 0);
  }, [query, hasResults, suggestions]);

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setQuery('');
    setIsVisible(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0 && (hasResults || suggestions.length > 0)) {
      setIsVisible(true);
    }
  };

  const handleFilterChange = (filter: 'all' | 'players' | 'teams' | 'tournaments') => {
    setActiveFilter(filter);
    setFilters({
      ...filters,
      type: filter === 'all' ? 'all' : filter.slice(0, -1) as 'player' | 'team' | 'tournament'
    });
  };

  return (
    <SearchContainer ref={searchRef} className={className}>
      <SearchIcon>🔍</SearchIcon>
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
        ) : suggestions.length > 0 && query.trim().length > 0 && !hasResults ? (
          <Suggestions>
            <CategoryTitle>Suggestions</CategoryTitle>
            {suggestions.map((suggestion, index) => (
              <SuggestionItem key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </SuggestionItem>
            ))}
          </Suggestions>
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
          </>
        )}
      </SearchResults>
    </SearchContainer>
  );
};

export default SearchComponent; 