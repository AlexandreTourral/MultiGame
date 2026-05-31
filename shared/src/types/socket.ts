import type { PublicGameState } from './gameState';
import type { PlayerAction } from './actions';

export interface ServerToClientEvents {
  room_created: (data: { roomId: string; playerId: string }) => void;
  room_joined: (data: { roomId: string; playerId: string }) => void;
  game_started: (state: PublicGameState) => void;
  game_state: (state: PublicGameState) => void;
  game_over: (data: { winnerId: string | null; state: PublicGameState }) => void;
  error: (data: { message: string }) => void;
  player_disconnected: (data: { playerId: string }) => void;
  opponent_reconnected: () => void;
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string }) => void;
  join_room: (data: { roomId: string; playerName: string }) => void;
  reconnect_room: (data: { roomId: string; playerId: string }) => void;
  player_action: (action: PlayerAction) => void;
  leave_room: () => void;
  request_game_state: () => void;
}
