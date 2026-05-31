import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@district-noir/shared';

/**
 * URL du serveur Socket.io.
 * En dev sans VITE_SERVER_URL : même origine que la page pour que le proxy Vite (/socket.io → :3001)
 * soit utilisé. En prod, VITE_SERVER_URL doit pointer vers le backend déployé (Render, Railway, etc.).
 */
export function getSocketServerUrl(): string {
  const explicit = import.meta.env.VITE_SERVER_URL?.trim();
  if (explicit) return explicit;
  if (import.meta.env.DEV && typeof window !== 'undefined') return window.location.origin;
  return import.meta.env.DEV ? 'http://localhost:3001' : '';
}

export function isSocketServerConfigured(): boolean {
  return getSocketServerUrl().length > 0;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(getSocketServerUrl(), {
  autoConnect: false,
});
