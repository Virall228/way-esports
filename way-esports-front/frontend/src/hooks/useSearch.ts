import { useState, useEffect, useCallback, useMemo } from 'react';

export interface SearchResult {
  id: string;
  type: 'player' | 'team' | 'tournament';
  name: string;
  avatar?: string;
  details: string;
  tag?: string;
  game?: string;
  status?: string;
  relevance: number;
  lastUpdated: Date;
}

export interface SearchFilters {
  type?: 'player' | 'team' | 'tournament' | 'all';
  game?: string;
  status?: string;
  sortBy?: 'relevance' | 'name' | 'recent';
}

export interface SearchOptions {
  debounceMs?: number;
  maxResults?: number;
  enableCache?: boolean;
  cacheExpiryMs?: number;
}

interface SearchCache {
  [query: string]: {
    results: SearchResult[];
    timestamp: number;
  };
}

export const useSearch = (
  data: SearchResult[],
  options: SearchOptions = {}
) => {
  const {
    debounceMs = 300,
    maxResults = 20,
    enableCache = true,
    cacheExpiryMs = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ type: 'all' });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cache, setCache] = useState<SearchCache>({});

  // Debounced search
  const debouncedQuery = useDebounce(query, debounceMs);

  // Search algorithm with relevance scoring
  const searchData = useCallback((
    searchQuery: string,
    searchFilters: SearchFilters,
    searchData: SearchResult[]
  ): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(' ').filter(word => word.length > 0);

    const scoredResults = searchData
      .map(item => {
        let score = 0;
        const itemText = `${item.name} ${item.tag || ''} ${item.details} ${item.game || ''}`.toLowerCase();

        // Exact matches get highest score
        if (item.name.toLowerCase().includes(query)) score += 100;
        if (item.tag?.toLowerCase().includes(query)) score += 80;
        if (itemText.includes(query)) score += 50;

        // Word-by-word matching
        queryWords.forEach(word => {
          if (item.name.toLowerCase().includes(word)) score += 30;
          if (item.tag?.toLowerCase().includes(word)) score += 25;
          if (itemText.includes(word)) score += 10;
        });

        // Type matching
        if (searchFilters.type && searchFilters.type !== 'all') {
          if (item.type === searchFilters.type) {
            score += 20;
          } else {
            score = 0; // Exclude if type doesn't match
          }
        }

        // Game filtering
        if (searchFilters.game && searchFilters.game !== 'all') {
          if (item.game === searchFilters.game) {
            score += 15;
          } else {
            score = 0; // Exclude if game doesn't match
          }
        }

        // Status filtering
        if (searchFilters.status) {
          if (item.status === searchFilters.status) {
            score += 10;
          } else {
            score = 0; // Exclude if status doesn't match
          }
        }

        // Recency bonus
        const daysSinceUpdate = (Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 1) score += 5;
        else if (daysSinceUpdate < 7) score += 3;
        else if (daysSinceUpdate < 30) score += 1;

        return { ...item, relevance: score };
      })
      .filter(item => item.relevance > 0)
      .sort((a, b) => {
        // Sort by relevance first, then by the specified sort criteria
        if (a.relevance !== b.relevance) {
          return b.relevance - a.relevance;
        }

        switch (searchFilters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'recent':
            return b.lastUpdated.getTime() - a.lastUpdated.getTime();
          default: // relevance
            return b.relevance - a.relevance;
        }
      })
      .slice(0, maxResults);

    return scoredResults;
  }, [maxResults]);

  // Perform search
  const performSearch = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters
  ): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    // Check cache first
    const cacheKey = `${searchQuery}:${JSON.stringify(searchFilters)}`;
    if (enableCache && cache[cacheKey]) {
      const cached = cache[cacheKey];
      if (Date.now() - cached.timestamp < cacheExpiryMs) {
        return cached.results;
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const results = searchData(searchQuery, searchFilters, data);

    // Cache results
    if (enableCache) {
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          results,
          timestamp: Date.now(),
        },
      }));
    }

    return results;
  }, [searchData, data, enableCache, cache, cacheExpiryMs]);

  // Update results when query or filters change
  useEffect(() => {
    const updateResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await performSearch(debouncedQuery, filters);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    updateResults();
  }, [debouncedQuery, filters, performSearch]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  // Clear expired cache entries
  useEffect(() => {
    if (!enableCache) return;

    const cleanupCache = () => {
      setCache(prev => {
        const now = Date.now();
        const cleaned = Object.entries(prev).reduce((acc, [key, value]) => {
          if (now - value.timestamp < cacheExpiryMs) {
            acc[key] = value;
          }
          return acc;
        }, {} as SearchCache);
        return cleaned;
      });
    };

    const interval = setInterval(cleanupCache, cacheExpiryMs);
    return () => clearInterval(interval);
  }, [enableCache, cacheExpiryMs]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups = {
      players: results.filter(r => r.type === 'player'),
      teams: results.filter(r => r.type === 'team'),
      tournaments: results.filter(r => r.type === 'tournament'),
    };

    return {
      ...groups,
      all: results,
      hasResults: results.length > 0,
      totalCount: results.length,
    };
  }, [results]);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const recentSearches = Object.keys(cache)
      .map(key => key.split(':')[0])
      .filter(search => search.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    const popularTerms = data
      .map(item => item.name.split(' ')[0])
      .filter(term => term.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);

    return [...new Set([...recentSearches, ...popularTerms])];
  }, [query, cache, data]);

  return {
    // State
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    groupedResults,
    suggestions,

    // Actions
    clearCache,
    performSearch: () => performSearch(query, filters),

    // Utilities
    hasResults: results.length > 0,
    totalCount: results.length,
  };
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 