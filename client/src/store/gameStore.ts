import { create } from 'zustand';
import type { PublicGameState } from '@district-noir/shared';

type LobbyPhase = 'HOME' | 'WAITING' | 'PLAYING' | 'GAME_OVER';

interface GameStore {
  lobbyPhase: LobbyPhase;
  roomId: string | null;
  playerId: string | null;
  playerName: string;
  gameState: PublicGameState | null;
  errorMessage: string | null;
  winnerId: string | null;
  instantWin: boolean;
  opponentDisconnected: boolean;

  setPlayerName: (name: string) => void;
  setRoom: (roomId: string, playerId: string) => void;
  setGameState: (state: PublicGameState) => void;
  setLobbyPhase: (phase: LobbyPhase) => void;
  setError: (message: string | null) => void;
  setGameOver: (winnerId: string | null, state: PublicGameState) => void;
  setOpponentDisconnected: (val: boolean) => void;
  /** Retour accueil si la session partie est définitivement perdue ; conserve le pseudonyme. */
  recoverFromDroppedSession: (detail: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  lobbyPhase: 'HOME',
  roomId: null,
  playerId: null,
  playerName: '',
  gameState: null,
  errorMessage: null,
  winnerId: null,
  instantWin: false,
  opponentDisconnected: false,

  setPlayerName: (name) => set({ playerName: name }),
  setRoom: (roomId, playerId) => set({ roomId, playerId, lobbyPhase: 'WAITING' }),
  setGameState: (state) => set({ gameState: state, lobbyPhase: 'PLAYING', opponentDisconnected: false }),
  setLobbyPhase: (phase) => set({ lobbyPhase: phase }),
  setError: (message) => set({ errorMessage: message }),
  setGameOver: (winnerId, state) => set({ winnerId, gameState: state, lobbyPhase: 'GAME_OVER', instantWin: state.instantWin }),
  setOpponentDisconnected: (val) => set({ opponentDisconnected: val }),
  recoverFromDroppedSession: (detail) =>
    set({
      lobbyPhase: 'HOME',
      roomId: null,
      playerId: null,
      gameState: null,
      winnerId: null,
      instantWin: false,
      opponentDisconnected: false,
      errorMessage:
        detail ??
        'La liaison avec la partie a été perdue. Tu peux recréer une partie depuis l’accueil.',
    }),
  reset: () =>
    set({
      lobbyPhase: 'HOME',
      roomId: null,
      playerId: null,
      gameState: null,
      errorMessage: null,
      winnerId: null,
      instantWin: false,
      opponentDisconnected: false,
    }),
}));
