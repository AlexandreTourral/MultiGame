import type { Card, SoutienType } from './card';

export type PlayerId = string;
export type GamePhase = 'WAITING' | 'PLAYING' | 'GAME_OVER';

export interface SoutienScore {
  type: SoutienType;
  value: number;
  counts: [number, number];
  winner: 0 | 1 | null;
}

export interface FinalScore {
  soutienScores: SoutienScore[];
  serieBonus: number;
  alliancePoints: number;
  trahisonPoints: number;
  total: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  hand: Card[];
  collected: Card[];
  hasTakenThisRound: boolean;
  actionsRemainingThisRound: number;
  score: number;
  finalScore?: FinalScore;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: [PlayerState, PlayerState] | [];
  currentPlayerId: PlayerId | null;
  line: Card[];
  deck: Card[];
  removedCards: Card[];
  round: number;
  maxRounds: number;
  lastAction: string | null;
  winner: PlayerId | null;
  instantWin: boolean;
}

export interface PublicPlayerState {
  id: PlayerId;
  name: string;
  handCount: number;
  collected: Card[];
  hasTakenThisRound: boolean;
  actionsRemainingThisRound: number;
  score: number;
  finalScore?: FinalScore;
}

export interface PublicGameState {
  roomId: string;
  phase: GamePhase;
  players: [PublicPlayerState, PublicPlayerState] | [];
  currentPlayerId: PlayerId | null;
  line: Card[];
  deckCount: number;
  round: number;
  maxRounds: number;
  lastAction: string | null;
  winner: PlayerId | null;
  instantWin: boolean;
  myHand: Card[];
}
