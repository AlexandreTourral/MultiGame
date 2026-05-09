import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@district-noir/shared';

/**
 * URL du serveur Socket.io.
 * En dev sans VITE_SERVER_URL : même origine que la page pour que le proxy Vite (/socket.io → :3001)
 * soit utilisé. Sinon `localhost:3001` désignerait toujours la machine du navigateur (réseau local cassé).
 */
export function getSocketServerUrl(): string {
  const explicit = import.meta.env.VITE_SERVER_URL?.trim();
  if (explicit) return explicit;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3001';
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(getSocketServerUrl(), {
  autoConnect: false,
});
