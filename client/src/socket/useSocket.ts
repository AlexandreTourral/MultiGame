import { useEffect } from 'react';
import { socket } from './socket';
import { useGameStore } from '../store/gameStore';
import type { PlayerAction } from '@district-noir/shared';

function shouldAbortSession(errorMessage: string, phase: 'HOME' | 'WAITING' | 'PLAYING' | 'GAME_OVER'): boolean {
  if (phase !== 'PLAYING' && phase !== 'WAITING') return false;
  const needles = [
    'Room introuvable',
    'identifiant invalide',
    'Partie introuvable',
    'Joueur introuvable',
    'Partie non démarrée',
    'Impossible de récupérer la partie',
  ];
  return needles.some((n) => errorMessage.includes(n));
}

export function useSocketInit() {
  const {
    setRoom,
    setGameState,
    setError,
    setGameOver,
    setOpponentDisconnected,
    recoverFromDroppedSession,
  } = useGameStore();

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      const { roomId, playerId, lobbyPhase } = useGameStore.getState();
      if (roomId && playerId && (lobbyPhase === 'PLAYING' || lobbyPhase === 'WAITING')) {
        socket.emit('reconnect_room', { roomId, playerId });
      }
    });

    socket.on('room_created', ({ roomId, playerId }) => {
      setRoom(roomId, playerId);
    });

    socket.on('room_joined', ({ roomId, playerId }) => {
      setRoom(roomId, playerId);
    });

    socket.on('game_started', (state) => {
      setGameState(state);
    });

    socket.on('game_state', (state) => {
      setGameState(state);
    });

    socket.on('game_over', ({ winnerId, state }) => {
      setGameOver(winnerId, state);
    });

    socket.on('error', ({ message }) => {
      const phase = useGameStore.getState().lobbyPhase;
      if (shouldAbortSession(message, phase)) {
        recoverFromDroppedSession(message);
        return;
      }
      setError(message);
      setTimeout(() => setError(null), 4000);
    });

    socket.on('player_disconnected', () => {
      setOpponentDisconnected(true);
    });

    socket.on('opponent_reconnected', () => {
      setOpponentDisconnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('game_started');
      socket.off('game_state');
      socket.off('game_over');
      socket.off('error');
      socket.off('player_disconnected');
      socket.off('opponent_reconnected');
      socket.disconnect();
    };
  }, [setRoom, setGameState, setError, setGameOver, setOpponentDisconnected, recoverFromDroppedSession]);
}

export function createRoom(playerName: string) {
  socket.emit('create_room', { playerName });
}

export function joinRoom(roomId: string, playerName: string) {
  socket.emit('join_room', { roomId, playerName });
}

export function sendAction(action: PlayerAction) {
  socket.emit('player_action', action);
}

export function requestGameState() {
  socket.emit('request_game_state');
}

export function reconnectRoom(roomId: string, playerId: string) {
  socket.emit('reconnect_room', { roomId, playerId });
}
