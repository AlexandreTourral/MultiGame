"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const uuid_1 = require("uuid");
const GameEngine_1 = require("../game/GameEngine");
class RoomManager {
    rooms = new Map();
    socketToRoom = new Map();
    code(roomId) {
        return roomId.trim().toUpperCase();
    }
    createRoom(socketId, playerName) {
        const roomId = (0, uuid_1.v4)().slice(0, 6).toUpperCase();
        const playerId = (0, uuid_1.v4)();
        this.rooms.set(roomId, {
            id: roomId,
            players: [{ id: playerId, name: playerName, socketId, connected: true }],
            engine: null,
        });
        this.socketToRoom.set(socketId, roomId);
        return { roomId, playerId };
    }
    joinRoom(socketId, roomId, playerName) {
        const id = this.code(roomId);
        const room = this.rooms.get(id);
        if (!room)
            return null;
        if (room.players.length >= 2)
            return null;
        const playerId = (0, uuid_1.v4)();
        room.players.push({ id: playerId, name: playerName, socketId, connected: true });
        this.socketToRoom.set(socketId, id);
        // Start game if 2 players
        if (room.players.length === 2) {
            const [p1, p2] = room.players;
            room.engine = new GameEngine_1.GameEngine(id, { id: p1.id, name: p1.name }, { id: p2.id, name: p2.name });
            return {
                playerId,
                started: true,
                state: room.engine.getPublicState(playerId),
                opponentName: p1.name,
            };
        }
        return { playerId, started: false };
    }
    applyAction(socketId, action) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return { success: false, error: 'Room introuvable.' };
        const room = this.rooms.get(roomId);
        if (!room || !room.engine)
            return { success: false, error: 'Partie non démarrée.' };
        const player = room.players.find((p) => p.socketId === socketId);
        if (!player)
            return { success: false, error: 'Joueur introuvable.' };
        const result = room.engine.applyAction(player.id, action);
        if (!result.success)
            return result;
        return { success: true, forAll: true };
    }
    getPublicStateForSocket(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return null;
        const room = this.rooms.get(roomId);
        if (!room || !room.engine)
            return null;
        const player = room.players.find((p) => p.socketId === socketId);
        if (!player)
            return null;
        return room.engine.getPublicState(player.id);
    }
    getRoom(roomId) {
        return this.rooms.get(this.code(roomId));
    }
    /** Partie pas encore commencée (le moteur n'existe pas tant qu'il n'y a pas 2 joueurs). */
    isWaitingLobby(roomId) {
        const room = this.rooms.get(this.code(roomId));
        return !!room && room.engine === null;
    }
    getPlayerSocketsInRoom(roomId) {
        return this.rooms.get(this.code(roomId))?.players.map((p) => p.socketId) ?? [];
    }
    getPublicStateForPlayer(roomId, playerId) {
        const room = this.rooms.get(this.code(roomId));
        if (!room || !room.engine)
            return null;
        return room.engine.getPublicState(playerId);
    }
    getRoomIdBySocket(socketId) {
        return this.socketToRoom.get(socketId);
    }
    /** Marque le joueur comme déconnecté sans supprimer la room. Retourne le roomId et l'id de l'autre joueur connecté. */
    disconnectSocket(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return null;
        this.socketToRoom.delete(socketId);
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const player = room.players.find((p) => p.socketId === socketId);
        if (player)
            player.connected = false;
        const other = room.players.find((p) => p.socketId !== socketId && p.connected);
        return { roomId, otherSocketId: other?.socketId ?? null };
    }
    /** Reconnecte un joueur existant avec son playerId. Retourne null si invalide. */
    reconnectPlayer(newSocketId, roomId, playerId) {
        const id = this.code(roomId);
        const room = this.rooms.get(id);
        if (!room)
            return null;
        const player = room.players.find((p) => p.id === playerId);
        if (!player)
            return null;
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
    isRoomAbandoned(roomId) {
        const room = this.rooms.get(this.code(roomId));
        if (!room)
            return true;
        return room.players.every((p) => !p.connected);
    }
    deleteRoom(roomId) {
        const id = this.code(roomId);
        const room = this.rooms.get(id);
        if (room) {
            room.players.forEach((p) => this.socketToRoom.delete(p.socketId));
        }
        this.rooms.delete(id);
    }
    isGameOver(roomId) {
        return this.rooms.get(this.code(roomId))?.engine?.isGameOver() ?? false;
    }
    /** Partie démarrée mais pas encore terminée — à ne pas supprimer quand tous les sockets sont hors ligne. */
    isOngoingGame(roomId) {
        const room = this.rooms.get(this.code(roomId));
        if (!room?.engine)
            return false;
        return !room.engine.isGameOver();
    }
    getWinner(roomId) {
        return this.rooms.get(this.code(roomId))?.engine?.getWinner() ?? null;
    }
    getPlayerIdBySocket(socketId) {
        const roomId = this.socketToRoom.get(socketId);
        if (!roomId)
            return null;
        const room = this.rooms.get(roomId);
        return room?.players.find((p) => p.socketId === socketId)?.id ?? null;
    }
}
exports.RoomManager = RoomManager;
