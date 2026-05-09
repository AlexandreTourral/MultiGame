import { Application } from 'pixi.js';
import type { PublicGameState } from '@district-noir/shared';
import { Board } from './Board';

export class PixiApp {
  private app: Application;
  private board: Board | null = null;
  private initialized = false;
  private destroyed = false;
  private container: HTMLDivElement | null = null;
  private boundOnResize: () => void;

  constructor() {
    this.app = new Application();
    this.boundOnResize = this.onResize.bind(this);
  }

  async init(container: HTMLDivElement) {
    this.container = container;

    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Si destroy() a été appelé pendant l'init async, on nettoie proprement
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }

    container.appendChild(this.app.canvas as HTMLCanvasElement);
    (this.app.canvas as HTMLCanvasElement).className = 'pixi-canvas';

    this.board = new Board(this.app);
    this.initialized = true;

    window.addEventListener('resize', this.boundOnResize);
  }

  updateState(state: PublicGameState, playerId: string) {
    if (!this.board || !this.initialized) return;
    this.board.update(state, playerId);
  }

  private onResize() {
    if (!this.initialized) return;
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
  }

  destroy() {
    this.destroyed = true;
    if (!this.initialized) return;
    this.initialized = false;
    window.removeEventListener('resize', this.boundOnResize);
    this.board?.destroy();
    const canvas = this.app.canvas as HTMLCanvasElement;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    this.app.destroy(true, { children: true });
  }
}
