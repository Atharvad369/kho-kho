import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { MatchData } from './types';

const MATCHES_KEY = '@khokho_matches';

export function generateFingerprint(teamA: string, teamB: string, date: string, venue: string): string {
  const raw = `${teamA.toLowerCase().trim()}-${teamB.toLowerCase().trim()}-${date.trim()}-${venue.toLowerCase().trim()}`;
  return raw.replace(/\s+/g, '_');
}

export function generateId(): string {
  return Crypto.randomUUID();
}

export async function getAllMatches(): Promise<MatchData[]> {
  const data = await AsyncStorage.getItem(MATCHES_KEY);
  if (!data) return [];
  const matches: MatchData[] = JSON.parse(data);
  return matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveMatch(match: MatchData): Promise<{ success: boolean; duplicate: boolean }> {
  const matches = await getAllMatches();
  const existing = matches.find(m => m.fingerprint === match.fingerprint && m.id !== match.id);
  if (existing) {
    return { success: false, duplicate: true };
  }
  const idx = matches.findIndex(m => m.id === match.id);
  if (idx >= 0) {
    matches[idx] = { ...match, updatedAt: new Date().toISOString() };
  } else {
    matches.push(match);
  }
  await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  return { success: true, duplicate: false };
}

export async function deleteMatch(id: string): Promise<void> {
  const matches = await getAllMatches();
  const filtered = matches.filter(m => m.id !== id);
  await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(filtered));
}

export async function getMatch(id: string): Promise<MatchData | undefined> {
  const matches = await getAllMatches();
  return matches.find(m => m.id === id);
}

export function simulateOCR(): {
  teamAPlayers: { name: string; score: number; confidence: number }[];
  teamBPlayers: { name: string; score: number; confidence: number }[];
} {
  const firstNames = ['Rahul', 'Amit', 'Priya', 'Sneha', 'Vikas', 'Deepak', 'Kavita', 'Rohan', 'Anita', 'Sanjay', 'Meera', 'Arjun'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Desai', 'Joshi', 'Verma', 'Gupta', 'Nair', 'Rao', 'Iyer', 'Reddy'];

  const usedNames = new Set<string>();
  const makeName = () => {
    let name = '';
    do {
      name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' +
             lastNames[Math.floor(Math.random() * lastNames.length)];
    } while (usedNames.has(name));
    usedNames.add(name);
    return name;
  };

  const makePlayer = () => ({
    name: makeName(),
    score: Math.floor(Math.random() * 8),
    confidence: 0.5 + Math.random() * 0.5,
  });

  return {
    teamAPlayers: Array.from({ length: 9 }, makePlayer),
    teamBPlayers: Array.from({ length: 9 }, makePlayer),
  };
}
