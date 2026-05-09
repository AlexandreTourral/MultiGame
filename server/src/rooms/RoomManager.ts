import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../game/GameEngine';
import { PlayerAction, PlayerId, PublicGameState } from '@district-noir/shared';

interface RoomPlayer {
  id: PlayerId;
  name: string;
  socketId: string;
  connected: boolean;
}

interface Room {
  id: string;
  players: RoomPlayer[];
  engine: GameEngine | null;
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  private code(roomId: string): string {
    return roomId.trim().toUpperCase();
  }

  createRoom(socketId: string, playerName: string): { roomId: string; playerId: string } {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const playerId = uuidv4();

    this.rooms.set(roomId, {
      id: roomId,
      players: [{ id: playerId, name: playerName, socketId, connected: true }],
      engine: null,
    });

    this.socketToRoom.set(socketId, roomId);
    return { roomId, playerId };
  }

  joinRoom(
    socketId: string,
    roomId: string,
    playerName: string
  ): { playerId: string; started: boolean; state?: PublicGameState; opponentName?: string } | null {
    const id = this.code(roomId);
    const room = this.rooms.get(id);
    if (!room) return null;
    if (room.players.length >= 2) return null;

    const playerId = uuidv4();
    room.players.push({ id: playerId, name: playerName, socketId, connected: true });
    this.socketToRoom.set(socketId, id);

    // Start game if 2 players
    if (room.players.length === 2) {
      const [p1, p2] = room.players;
      room.engine = new GameEngine(id, { id: p1.id, name: p1.name }, { id: p2.id, name: p2.name });

      return {
        playerId,
        started: true,
        state: room.engine.getPublicState(playerId),
        opponentName: p1.name,
      };
    }

    return { playerId, started: false };
  }

  applyAction(
    socketId: string,
    action: PlayerAction
  ): { success: boolean; error?: string; state?: PublicGameState; forAll?: boolean } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return { success: false, error: 'Room introuvable.' };

    const room = this.rooms.get(roomId);
    if (!room || !room.engine) return { success: false, error: 'Partie non démarrée.' };

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return { success: false, error: 'Joueur introuvable.' };

    const result = room.engine.applyAction(player.id, action);
    if (!result.success) return result;

    return { success: true, forAll: true };
  }

  getPublicStateForSocket(socketId: string): PublicGameState | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room || !room.engine) return null;

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) return null;

    return room.engine.getPublicState(player.id);
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(this.code(roomId));
  }

  /** Partie pas encore commencée (le moteur n'existe pas tant qu'il n'y a pas 2 joueurs). */
  isWaitingLobby(roomId: string): boolean {
    const room = this.rooms.get(this.code(roomId));
    return !!room && room.engine === null;
  }

  getPlayerSocketsInRoom(roomId: string): string[] {
    return this.rooms.get(this.code(roomId))?.players.map((p) => p.socketId) ?? [];
  }

  getPublicStateForPlayer(roomId: string, playerId: string): PublicGameState | null {
    const room = this.rooms.get(this.code(roomId));
    if (!room || !room.engine) return null;
    return room.engine.getPublicState(playerId);
  }

  getRoomIdBySocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
  }

  /** Marque le joueur comme déconnecté sans supprimer la room. Retourne le roomId et l'id de l'autre joueur connecté. */
  disconnectSocket(socketId: string): { roomId: string; otherSocketId: string | null } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    this.socketToRoom.delete(socketId);

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find((p) => p.socketId === socketId);
    if (player) player.connected = false;

    const other = room.players.find((p) => p.socketId !== socketId && p.connected);
    return { roomId, otherSocketId: other?.socketId ?? null };
  }

  /** Reconnecte un joueur existant avec son playerId. Retourne null si invalide. */
  reconnectPlayer(
    newSocketId: string,
    roomId: string,
    playerId: string
  ): { name: string; otherSocketId: string | null } | null {
    const id = this.code(roomId);
    const room = this.rooms.get(id);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    // Retirer l'ancienne entrée socketToRoom si elle existe encore
    if (player.socketId && player.socketId !== newSocketId) {
      this.socketToRoom.delete(player.socketId);
    }

    player.socketId = newSocketId;
    player.connected = true;
    this.socketToRoom.set(newSocketId, id);

    const other = room.players.find((p) => p.id !== playerId && p.connected);
    return { name: player.name, otherSocketId: other?.socketId ?? null };
  }

  /** Vérifie si tous les joueurs sont déconnectés (room à supprimer). */
  isRoomAbandoned(roomId: string): boolean {
    const room = this.rooms.get(this.code(roomId));
    if (!room) return true;
    return room.players.every((p) => !p.connected);
  }

  deleteRoom(roomId: string) {
    const id = this.code(roomId);
    const room = this.rooms.get(id);
    if (room) {
      room.players.forEach((p) => this.socketToRoom.delete(p.socketId));
    }
    this.rooms.delete(id);
  }

  isGameOver(roomId: string): boolean {
    return this.rooms.get(this.code(roomId))?.engine?.isGameOver() ?? false;
  }

  /** Partie démarrée mais pas encore terminée — à ne pas supprimer quand tous les sockets sont hors ligne. */
  isOngoingGame(roomId: string): boolean {
    const room = this.rooms.get(this.code(roomId));
    if (!room?.engine) return false;
    return !room.engine.isGameOver();
  }

  getWinner(roomId: string): string | null {
    return this.rooms.get(this.code(roomId))?.engine?.getWinner() ?? null;
  }

  getPlayerIdBySocket(socketId: string): string | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    return room?.players.find((p) => p.socketId === socketId)?.id ?? null;
  }
}
