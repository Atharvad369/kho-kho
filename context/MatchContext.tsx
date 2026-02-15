import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { MatchData } from '@/lib/types';
import { getAllMatches, saveMatch, deleteMatch as deleteMatchStorage } from '@/lib/match-storage';

interface MatchContextValue {
  matches: MatchData[];
  isLoading: boolean;
  refreshMatches: () => Promise<void>;
  addOrUpdateMatch: (match: MatchData) => Promise<{ success: boolean; duplicate: boolean }>;
  removeMatch: (id: string) => Promise<void>;
  getMatchById: (id: string) => MatchData | undefined;
  stats: {
    totalMatches: number;
    confirmedMatches: number;
    draftMatches: number;
    recentMatches: MatchData[];
  };
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMatches = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllMatches();
    setMatches(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshMatches();
  }, [refreshMatches]);

  const addOrUpdateMatch = useCallback(async (match: MatchData) => {
    const result = await saveMatch(match);
    if (result.success) {
      await refreshMatches();
    }
    return result;
  }, [refreshMatches]);

  const removeMatch = useCallback(async (id: string) => {
    await deleteMatchStorage(id);
    await refreshMatches();
  }, [refreshMatches]);

  const getMatchById = useCallback((id: string) => {
    return matches.find(m => m.id === id);
  }, [matches]);

  const stats = useMemo(() => {
    const confirmed = matches.filter(m => m.status === 'confirmed');
    const drafts = matches.filter(m => m.status === 'draft');
    const recent = matches.slice(0, 5);
    return {
      totalMatches: matches.length,
      confirmedMatches: confirmed.length,
      draftMatches: drafts.length,
      recentMatches: recent,
    };
  }, [matches]);

  const value = useMemo(() => ({
    matches,
    isLoading,
    refreshMatches,
    addOrUpdateMatch,
    removeMatch,
    getMatchById,
    stats,
  }), [matches, isLoading, refreshMatches, addOrUpdateMatch, removeMatch, getMatchById, stats]);

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
}
