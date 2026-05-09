import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerAction,
} from '@district-noir/shared';
import { RoomManager } from './rooms/RoomManager';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const roomManager = new RoomManager();

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log(`[+] Connexion: ${socket.id}`);

  socket.on('create_room', ({ playerName }) => {
    const { roomId, playerId } = roomManager.createRoom(socket.id, playerName);
    socket.join(roomId);
    socket.emit('room_created', { roomId, playerId });
    console.log(`[ROOM] ${playerName} crée la room ${roomId}`);
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const code = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const room = roomManager.getRoom(code);
    if (!room) {
      socket.emit('error', {
        message:
          'Partie introuvable. Vérifie le code et que tous les joueurs utilisent la même URL de serveur (ex. tous en local ou tous sur le même hébergement).',
      });
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('error', { message: 'Cette partie est déjà complète.' });
      return;
    }

    const result = roomManager.joinRoom(socket.id, code, playerName);
    if (!result) return;

    socket.join(code);
    socket.emit('room_joined', { roomId: code, playerId: result.playerId });

    if (result.started && result.state) {
      console.log(`[GAME] Partie démarrée dans la room ${code}`);

      const playerSockets = roomManager.getPlayerSocketsInRoom(code);

      for (const socketId of playerSockets) {
        const playerId = roomManager.getPlayerIdBySocket(socketId);
        if (!playerId) continue;
        const state = roomManager.getPublicStateForPlayer(code, playerId);
        if (!state) continue;

        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) {
          targetSocket.emit('game_started', state);
          console.log(`[GAME] game_started envoyé à ${socketId} (joueur ${playerId.slice(0, 6)})`);
        } else {
          console.warn(`[GAME] Socket introuvable pour ${socketId} — game_started non envoyé`);
        }
      }
    }
  });

  socket.on('player_action', (action: PlayerAction) => {
    const result = roomManager.applyAction(socket.id, action);

    if (!result.success) {
      socket.emit('error', { message: result.error ?? 'Erreur inconnue.' });
      return;
    }

    const roomId = roomManager.getRoomIdBySocket(socket.id);
    if (!roomId) return;

    const playerSockets = roomManager.getPlayerSocketsInRoom(roomId);
    const isOver = roomManager.isGameOver(roomId);

    for (const socketId of playerSockets) {
      const playerId = roomManager.getPlayerIdBySocket(socketId);
      if (!playerId) continue;
      const state = roomManager.getPublicStateForPlayer(roomId, playerId);
      if (!state) continue;

      const targetSocket = io.sockets.sockets.get(socketId);
      if (!targetSocket) continue;

      if (isOver) {
        targetSocket.emit('game_over', {
          winnerId: roomManager.getWinner(roomId),
          state,
        });
      } else {
        targetSocket.emit('game_state', state);
      }
    }
  });

  socket.on('reconnect_room', ({ roomId, playerId }) => {
    const code = typeof roomId === 'string' ? roomId.trim().toUpperCase() : '';
    const result = roomManager.reconnectPlayer(socket.id, code, playerId);
    if (!result) {
      socket.emit('error', {
        message:
          'Impossible de récupérer la partie : code invalide ou la session a été supprimée par le serveur. Retournez à l’accueil et recommencez.',
      });
      return;
    }

    socket.join(code);
    socket.emit('room_joined', { roomId: code, playerId });

    const state = roomManager.getPublicStateForPlayer(code, playerId);
    if (state) {
      const isOver = roomManager.isGameOver(code);
      if (isOver) {
        socket.emit('game_over', { winnerId: roomManager.getWinner(code), state });
      } else {
        socket.emit('game_started', state);
      }
    }

    if (result.otherSocketId) {
      const otherSocket = io.sockets.sockets.get(result.otherSocketId);
      otherSocket?.emit('opponent_reconnected');
    }

    console.log(`[ROOM] Reconnexion: ${result.name} dans ${code}`);
  });

  socket.on('request_game_state', () => {
    const roomId = roomManager.getRoomIdBySocket(socket.id);
    if (!roomId) return;
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const state = roomManager.getPublicStateForPlayer(roomId, playerId);
    if (!state) return;
    const isOver = roomManager.isGameOver(roomId);
    if (isOver) {
      socket.emit('game_over', { winnerId: roomManager.getWinner(roomId), state });
    } else {
      socket.emit('game_started', state);
    }
    console.log(`[GAME] État resynchronisé pour ${socket.id}`);
  });

  socket.on('leave_room', () => {
    handleLeave(socket.id);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket.id);
    console.log(`[-] Déconnexion: ${socket.id}`);
  });
});

function handleDisconnect(socketId: string) {
  const result = roomManager.disconnectSocket(socketId);
  if (!result) return;

  const { roomId, otherSocketId } = result;

  // En lobby (un seul joueur possible tant que la partie n'a pas démarré), ne pas supprimer la room :
  // sinon une micro-coupure réseau avant l'arrivée du 2ᵉ joueur invalide le code alors que l'hôte revient.
  if (roomManager.isWaitingLobby(roomId)) {
    if (otherSocketId) {
      const otherSocket = io.sockets.sockets.get(otherSocketId);
      otherSocket?.emit('player_disconnected', { playerId: socketId });
    }
    return;
  }

  if (roomManager.isRoomAbandoned(roomId)) {
    if (roomManager.isOngoingGame(roomId)) {
      console.log(`[ROOM] Room ${roomId} conservée (partie en cours, reconnexion possible)`);
      return;
    }
    roomManager.deleteRoom(roomId);
    console.log(`[ROOM] Room ${roomId} supprimée (tous déconnectés)`);
    return;
  }

  if (otherSocketId) {
    const otherSocket = io.sockets.sockets.get(otherSocketId);
    otherSocket?.emit('player_disconnected', { playerId: socketId });
  }
}

function handleLeave(socketId: string) {
  const result = roomManager.disconnectSocket(socketId);
  if (!result) return;
  const { roomId, otherSocketId } = result;
  roomManager.deleteRoom(roomId);
  if (otherSocketId) {
    const otherSocket = io.sockets.sockets.get(otherSocketId);
    otherSocket?.emit('player_disconnected', { playerId: socketId });
  }
}

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`[SERVER] District Noir server en écoute sur le port ${PORT}`);
});
