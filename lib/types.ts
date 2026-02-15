export interface Player {
  name: string;
  score: number;
  confidence: number;
}

export interface TeamData {
  name: string;
  nameConfidence: number;
  players: Player[];
  totalScore: number;
}

export interface MatchData {
  id: string;
  date: string;
  venue: string;
  venueConfidence: number;
  dateConfidence: number;
  teamA: TeamData;
  teamB: TeamData;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
  isAutoFilled: boolean;
  autoFilledFields: string[];
  status: 'draft' | 'confirmed';
  fingerprint: string;
}

export interface OCRResult {
  teamAName: string;
  teamANameConfidence: number;
  teamBName: string;
  teamBNameConfidence: number;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamAScore: number;
  teamBScore: number;
  date: string;
  dateConfidence: number;
  venue: string;
  venueConfidence: number;
  autoFilledFields: string[];
}
