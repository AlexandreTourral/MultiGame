import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { PublicGameState, Card, SoutienType } from '@district-noir/shared';
import { CardSprite } from './CardSprite';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  SOUTIEN_COLORS,
  SOUTIEN_VALUES_DISPLAY,
} from './constants';
import { sendAction } from '../socket/useSocket';

export class Board {
  /** Espace laissé sous la barre React (HUD + bannière de tour) pour que les encadrés Pixi ne soient pas masqués. */
  private static readonly INFO_BELOW_NAV_Y = 100;

  /** Panneau « cartes récoltées » (colonne droite) : lisibilité + compteur mis en avant. */
  private static readonly COLLECTED_CHIP_W = 248;
  private static readonly COLLECTED_PANEL_RIGHT_PAD = 16;
  private static readonly COLLECTED_ROW_H = 40;
  private static readonly COLLECTED_GAP_Y = 4;
  /** Libellés lisibles dans le récap (évite truncate / ALL CAPS incompréhensibles). */
  private static readonly COLLECTED_SOUTIEN_NAMES: Record<SoutienType, string> = {
    INFORMATEUR: 'Informateur',
    PICKPOCKET: 'Pickpocket',
    SBIRE: 'Sbire',
    CAID: 'Caïd',
  };

  private app: Application;
  private root: Container;

  private bgLayer: Container;
  private lineContainer: Container;
  private handContainer: Container;
  private collectedContainer: Container;
  private actionBar: Container;
  private infoLayer: Container;

  private handSprites: Map<string, CardSprite> = new Map();
  private selectedCardId: string | null = null;

  private state: PublicGameState | null = null;
  private playerId: string | null = null;

  constructor(app: Application) {
    this.app = app;
    this.root = new Container();

    this.bgLayer = new Container();
    this.lineContainer = new Container();
    this.handContainer = new Container();
    this.collectedContainer = new Container();
    this.actionBar = new Container();
    this.infoLayer = new Container();

    this.app.stage.addChild(this.root);
    this.root.addChild(this.bgLayer);
    this.root.addChild(this.collectedContainer);
    this.root.addChild(this.lineContainer);
    this.root.addChild(this.handContainer);
    this.root.addChild(this.actionBar);
    this.root.addChild(this.infoLayer);

    this.drawBackground();
  }

  private W() { return this.app.screen.width; }
  private H() { return this.app.screen.height; }

  private drawBackground() {
    const bg = new Graphics();
    bg.rect(0, 0, this.W(), this.H());
    bg.fill(0x080810);
    this.bgLayer.addChild(bg);

    // Subtle horizontal separator lines
    const sep1 = new Graphics();
    sep1.moveTo(0, this.H() * 0.45);
    sep1.lineTo(this.W(), this.H() * 0.45);
    sep1.stroke({ width: 1, color: 0x111122, alpha: 0.8 });
    this.bgLayer.addChild(sep1);

    const sep2 = new Graphics();
    sep2.moveTo(0, this.H() * 0.7);
    sep2.lineTo(this.W(), this.H() * 0.7);
    sep2.stroke({ width: 1, color: 0x111122, alpha: 0.8 });
    this.bgLayer.addChild(sep2);
  }

  update(state: PublicGameState, playerId: string) {
    const prevRound = this.state?.round;
    this.state = state;
    this.playerId = playerId;

    if (prevRound !== state.round && prevRound !== undefined) {
      this.selectedCardId = null;
    }

    this.renderLine();
    this.renderHand();
    this.renderCollected();
    this.renderActionBar();
    this.renderInfo();
  }

  private renderLine() {
    this.lineContainer.removeChildren();
    if (!this.state) return;

    const W = this.W();
    const lineY = this.H() * 0.45 - CARD_HEIGHT / 2 - 20;

    const label = new Text({
      text: 'LIGNE',
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x6f6f95, letterSpacing: 3 }),
    });
    label.anchor.set(0.5, 1);
    label.position.set(W / 2, lineY - 4);
    this.lineContainer.addChild(label);

    const line = this.state.line;

    if (line.length === 0) {
      const empty = new Text({
        text: 'La ligne est vide',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 13, fill: 0x5c5c82, fontStyle: 'italic' }),
      });
      empty.anchor.set(0.5, 0.5);
      empty.position.set(W / 2, lineY + CARD_HEIGHT / 2);
      this.lineContainer.addChild(empty);
      return;
    }

    const maxVisible = Math.floor((W - 80) / (CARD_WIDTH + 8));
    const showFrom = Math.max(0, line.length - maxVisible);
    const visible = line.slice(showFrom);

    const spacing = CARD_WIDTH + 8;
    const totalW = visible.length * spacing - 8;
    const startX = W / 2 - totalW / 2;

    if (showFrom > 0) {
      const older = new Text({
        text: `+${showFrom} cartes plus anciennes`,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x5c5c82, fontStyle: 'italic' }),
      });
      older.anchor.set(0, 0.5);
      older.position.set(16, lineY + CARD_HEIGHT / 2);
      this.lineContainer.addChild(older);
    }

    visible.forEach((card, i) => {
      const isLast5 = i >= visible.length - 5;
      const sprite = new CardSprite({ card, faceUp: true });
      sprite.position.set(startX + i * spacing, lineY);
      sprite.alpha = isLast5 ? 1.0 : 0.45;
      this.lineContainer.addChild(sprite);

      // Highlight the last 5 cards (potential take)
      if (isLast5) {
        const hl = new Graphics();
        hl.roundRect(-2, -2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 8);
        hl.stroke({ width: 1, color: 0x444488, alpha: 0.6 });
        hl.position.set(startX + i * spacing, lineY);
        this.lineContainer.addChild(hl);
      }
    });

    // "Last 5" bracket label
    if (line.length >= 2) {
      const bracketStart = Math.max(0, visible.length - 5);
      const bracketX = startX + bracketStart * spacing - 2;
      const bracketW = Math.min(5, visible.length) * spacing - 6;

      const bracketBg = new Graphics();
      bracketBg.roundRect(bracketX, lineY - 18, bracketW, 14, 3);
      bracketBg.fill({ color: 0x222244, alpha: 0.8 });
      this.lineContainer.addChild(bracketBg);

      const bracketLabel = new Text({
        text: `${Math.min(5, line.length)} dernières (prenables)`,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 8, fill: 0x8a8acc }),
      });
      bracketLabel.anchor.set(0, 0.5);
      bracketLabel.position.set(bracketX + 6, lineY - 11);
      this.lineContainer.addChild(bracketLabel);
    }
  }

  private renderHand() {
    this.handContainer.removeChildren();
    this.handSprites.clear();
    if (!this.state) return;

    const W = this.W();
    const H = this.H();
    const hand = this.state.myHand;
    const isMyTurn = this.state.currentPlayerId === this.playerId;

    const cardTop = H - CARD_HEIGHT - 22;
    const gapAboveCards = 10;
    const betweenTitleAndHint = 6;

    const label = new Text({
      text: 'TA MAIN',
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x6f6f95, letterSpacing: 3 }),
    });
    label.anchor.set(0.5, 1);

    if (hand.length === 0) {
      label.position.set(W / 2, cardTop - gapAboveCards);
      this.handContainer.addChild(label);
      const empty = new Text({
        text: 'Main vide',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0x5c5c82, fontStyle: 'italic' }),
      });
      empty.anchor.set(0.5, 0.5);
      empty.position.set(W / 2, H - CARD_HEIGHT / 2 - 24);
      this.handContainer.addChild(empty);
      return;
    }

    const me = this.state.players.find((p) => p.id === this.playerId);
    const canPlay = isMyTurn && hand.length > 0;
    const spacing = Math.min(CARD_WIDTH + 10, (W - 80) / hand.length);
    const totalW = (hand.length - 1) * spacing + CARD_WIDTH;
    const startX = W / 2 - totalW / 2;
    const y = H - CARD_HEIGHT - 22;

    if (canPlay && !me?.hasTakenThisRound) {
      const hint = new Text({
        text: 'Clique sur une carte pour la jouer',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x5c5c82, fontStyle: 'italic' }),
      });
      hint.anchor.set(0.5, 1);
      hint.position.set(W / 2, cardTop - gapAboveCards);
      label.position.set(W / 2, cardTop - gapAboveCards - hint.height - betweenTitleAndHint);
      this.handContainer.addChild(label);
      this.handContainer.addChild(hint);
    } else {
      label.position.set(W / 2, cardTop - gapAboveCards);
      this.handContainer.addChild(label);
    }

    hand.forEach((card, i) => {
      const sprite = new CardSprite({
        card,
        faceUp: true,
        interactive: canPlay,
        onSelect: (c) => this.handleCardClick(c),
      });
      sprite.position.set(startX + i * spacing, y);
      sprite.zIndex = i;
      if (this.selectedCardId === card.id) sprite.setSelected(true);
      this.handContainer.addChild(sprite);
      this.handSprites.set(card.id, sprite);
    });
  }

  private renderCollected() {
    this.collectedContainer.removeChildren();
    if (!this.state) return;

    const me = this.state.players.find((p) => p.id === this.playerId);
    const opponent = this.state.players.find((p) => p.id !== this.playerId);
    if (!me || !opponent) return;

    const panelX = this.collectedPanelX();

    // My collected (bottom right)
    this.renderCollectedGroup(me.collected, panelX, this.H() * 0.65, 'MES CARTES');

    // Opponent collected (top right, sous le HUD)
    this.renderCollectedGroup(
      opponent.collected,
      panelX,
      Board.INFO_BELOW_NAV_Y,
      `${opponent.name}`,
    );
  }

  private collectedPanelX(): number {
    return this.W() - Board.COLLECTED_CHIP_W - Board.COLLECTED_PANEL_RIGHT_PAD;
  }

  /** Pastille « ×N » à droite de chaque ligne pour scanner les quantités au premier coup d’œil. */
  private drawCollectedCountPill(x: number, rowY: number, count: number, accent: number): void {
    const pillW = 54;
    const pillH = 28;
    const right = x + Board.COLLECTED_CHIP_W - 10;
    const px = right - pillW;
    const py = rowY + (Board.COLLECTED_ROW_H - pillH) / 2;

    const pill = new Graphics();
    pill.roundRect(px, py, pillW, pillH, 8);
    pill.fill({ color: 0x12121e, alpha: 0.95 });
    pill.stroke({ width: 2, color: accent, alpha: 1 });
    this.collectedContainer.addChild(pill);

    const t = new Text({
      text: `×${count}`,
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 17, fill: 0xffffff, fontWeight: 'bold' }),
    });
    t.anchor.set(0.5, 0.5);
    t.position.set(px + pillW / 2, py + pillH / 2);
    this.collectedContainer.addChild(t);
  }

  private renderCollectedGroup(collected: Card[], x: number, y: number, title: string) {
    const titleText = new Text({
      text: title.toUpperCase(),
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 11,
        fill: 0xe2e2f5,
        letterSpacing: 2,
        fontWeight: 'bold',
      }),
    });
    titleText.position.set(x, y);
    this.collectedContainer.addChild(titleText);

    const types: Array<{ key: SoutienType; count: number; color: number }> = [];

    const soutienTypes = ['INFORMATEUR', 'PICKPOCKET', 'SBIRE', 'CAID'] as const;
    for (const t of soutienTypes) {
      const count = collected.filter((c) => c.type === 'SOUTIEN' && c.soutienType === t).length;
      if (count > 0) types.push({ key: t, count, color: SOUTIEN_COLORS[t] });
    }

    const alliance = collected.filter((c) => c.type === 'ALLIANCE');
    const trahison = collected.filter((c) => c.type === 'TRAHISON');
    const ville = collected.filter((c) => c.type === 'VILLE');

    let rowY = y + 22;

    types.forEach((t) => {
      const chip = new Graphics();
      chip.roundRect(x, rowY, Board.COLLECTED_CHIP_W, Board.COLLECTED_ROW_H, 8);
      chip.fill({ color: t.color, alpha: 0.18 });
      chip.stroke({ width: 1.5, color: t.color, alpha: 0.65 });
      this.collectedContainer.addChild(chip);

      const name = Board.COLLECTED_SOUTIEN_NAMES[t.key];
      const palier = SOUTIEN_VALUES_DISPLAY[t.key];

      const titleLine = new Text({
        text: name,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xf5f5ff, fontWeight: 'bold' }),
      });
      titleLine.position.set(x + 12, rowY + 5);
      this.collectedContainer.addChild(titleLine);

      const subLine = new Text({
        text: `${palier} pts si majorité`,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0xb8c4e8 }),
      });
      subLine.position.set(x + 12, rowY + 22);
      this.collectedContainer.addChild(subLine);

      this.drawCollectedCountPill(x, rowY, t.count, t.color);

      rowY += Board.COLLECTED_ROW_H + Board.COLLECTED_GAP_Y;
    });

    if (alliance.length > 0) {
      const ap = alliance.reduce((s, c) => s + (c.pointValue ?? 0), 0);
      const chip = new Graphics();
      chip.roundRect(x, rowY, Board.COLLECTED_CHIP_W, Board.COLLECTED_ROW_H, 8);
      chip.fill({ color: 0xc8a000, alpha: 0.12 });
      chip.stroke({ width: 1.5, color: 0xffd700, alpha: 0.55 });
      this.collectedContainer.addChild(chip);

      const line1 = new Text({
        text: 'Alliance',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xffe566, fontWeight: 'bold' }),
      });
      line1.position.set(x + 12, rowY + 5);
      this.collectedContainer.addChild(line1);

      const line2 = new Text({
        text: `+${ap} pts au total`,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0xd4bf70 }),
      });
      line2.position.set(x + 12, rowY + 22);
      this.collectedContainer.addChild(line2);

      this.drawCollectedCountPill(x, rowY, alliance.length, 0xffd700);
      rowY += Board.COLLECTED_ROW_H + Board.COLLECTED_GAP_Y;
    }

    if (trahison.length > 0) {
      const tp = trahison.reduce((s, c) => s + (c.pointValue ?? 0), 0);
      const chip = new Graphics();
      chip.roundRect(x, rowY, Board.COLLECTED_CHIP_W, Board.COLLECTED_ROW_H, 8);
      chip.fill({ color: 0xaa2222, alpha: 0.15 });
      chip.stroke({ width: 1.5, color: 0xe63946, alpha: 0.55 });
      this.collectedContainer.addChild(chip);

      const line1 = new Text({
        text: 'Trahison',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xff9a9a, fontWeight: 'bold' }),
      });
      line1.position.set(x + 12, rowY + 5);
      this.collectedContainer.addChild(line1);

      const line2 = new Text({
        text: `${tp} pts au total`,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0xd88a8a }),
      });
      line2.position.set(x + 12, rowY + 22);
      this.collectedContainer.addChild(line2);

      this.drawCollectedCountPill(x, rowY, trahison.length, 0xff4444);
      rowY += Board.COLLECTED_ROW_H + Board.COLLECTED_GAP_Y;
    }

    if (ville.length > 0) {
      const chip = new Graphics();
      chip.roundRect(x, rowY, Board.COLLECTED_CHIP_W, Board.COLLECTED_ROW_H, 8);
      chip.fill({ color: 0x607d8b, alpha: 0.15 });
      chip.stroke({ width: 1.5, color: 0x90a4ae, alpha: 0.55 });
      this.collectedContainer.addChild(chip);

      const line1 = new Text({
        text: 'Ville 🏙',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: 0xcfd8dc, fontWeight: 'bold' }),
      });
      line1.position.set(x + 12, rowY + 5);
      this.collectedContainer.addChild(line1);

      const line2 = new Text({
        text: '3 différentes = victoire',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0x9eb0b8 }),
      });
      line2.position.set(x + 12, rowY + 22);
      this.collectedContainer.addChild(line2);

      this.drawCollectedCountPill(x, rowY, ville.length, 0xb0c4ce);
      rowY += Board.COLLECTED_ROW_H + Board.COLLECTED_GAP_Y;
    }

    if (collected.length === 0) {
      const empty = new Text({
        text: 'Aucune carte récoltée',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x9aa6c4, fontStyle: 'italic' }),
      });
      empty.position.set(x, rowY);
      this.collectedContainer.addChild(empty);
    }
  }

  private renderActionBar() {
    this.actionBar.removeChildren();
    if (!this.state) return;

    const isMyTurn = this.state.currentPlayerId === this.playerId;
    if (!isMyTurn) return;

    const me = this.state.players.find((p) => p.id === this.playerId);
    if (!me) return;

    const W = this.W();
    const H = this.H();
    const barY = H * 0.45 + CARD_HEIGHT / 2 + 8;

    const canTake = !me.hasTakenThisRound && this.state.line.length > 0;
    const canPlay = this.state.myHand.length > 0;

    const buttons = [
      {
        label: canTake
          ? `Prendre les ${Math.min(5, this.state.line.length)} dernières cartes`
          : me.hasTakenThisRound
          ? 'Déjà pris ce tour'
          : 'Ligne vide',
        enabled: canTake,
        action: () => { sendAction({ type: 'TAKE_CARDS' }); },
        color: canTake ? 0xffd700 : 0x4e4e62,
        textColor: canTake ? 0x000000 : 0x5c5c82,
      },
    ];

    let totalW = 0;
    const btnW = 220;
    const gap = 16;
    totalW = buttons.length * btnW + (buttons.length - 1) * gap;
    const startX = W / 2 - totalW / 2;

    buttons.forEach((btn, i) => {
      const bx = startX + i * (btnW + gap);
      const bg = new Graphics();
      bg.roundRect(0, 0, btnW, 36, 6);
      bg.fill({ color: btn.enabled ? 0x1a1a3e : 0x0a0a18, alpha: btn.enabled ? 1 : 0.7 });
      bg.stroke({ width: 1, color: btn.enabled ? btn.color : 0x222233 });

      const lbl = new Text({
        text: btn.label,
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: btn.enabled ? btn.textColor || 0xaaaadd : 0x5c5c82, fontWeight: btn.enabled ? 'bold' : 'normal' }),
      });
      lbl.anchor.set(0.5, 0.5);
      lbl.position.set(btnW / 2, 18);

      const c = new Container();
      c.addChild(bg);
      c.addChild(lbl);
      c.position.set(bx, barY);

      if (btn.enabled) {
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.on('pointerover', () => { bg.tint = 0xddddff; });
        c.on('pointerout', () => { bg.tint = 0xffffff; });
        c.on('pointertap', btn.action);
      }

      this.actionBar.addChild(c);
    });

    // Hint for playing a card
    if (canPlay) {
      const hintText = new Text({
        text: 'ou clique sur une carte dans ta main pour la jouer',
        style: new TextStyle({ fontFamily: 'Arial', fontSize: 10, fill: 0x5c5c82, fontStyle: 'italic' }),
      });
      hintText.anchor.set(0.5, 0);
      hintText.position.set(W / 2, barY + 40);
      this.actionBar.addChild(hintText);
    }
  }

  private renderInfo() {
    this.infoLayer.removeChildren();
    if (!this.state) return;

    const H = this.H();

    const me = this.state.players.find((p) => p.id === this.playerId);
    const opp = this.state.players.find((p) => p.id !== this.playerId);
    const isMyTurn = this.state.currentPlayerId === this.playerId;

    if (me && opp) {
      this.renderPlayerBar(opp, !isMyTurn, Board.INFO_BELOW_NAV_Y, false);
      this.renderPlayerBar(me, isMyTurn, H * 0.7 - 34, true);
    }
  }

  private renderPlayerBar(player: { name: string; handCount: number; hasTakenThisRound: boolean; actionsRemainingThisRound: number }, isActive: boolean, y: number, isMe: boolean) {
    const panelW = 272;
    const panelH = 48;
    const x = 14;
    const padX = 12;
    const padY = 8;

    const bg = new Graphics();
    bg.roundRect(x, y, panelW, panelH, 10);
    bg.fill({ color: isActive ? 0x16162e : 0x101022, alpha: 0.96 });
    bg.stroke({
      width: isActive ? 2 : 1,
      color: isActive ? (isMe ? 0xc8a000 : 0x6666ee) : 0x38385a,
    });
    this.infoLayer.addChild(bg);

    const nameText = new Text({
      text: `${player.name}${isMe ? ' (toi)' : ''}`,
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 12, fill: isActive ? (isMe ? 0xffd700 : 0xb4b4ff) : 0xb8b8dc, fontWeight: isActive ? 'bold' : 'normal' }),
    });
    nameText.position.set(x + padX, y + padY);
    this.infoLayer.addChild(nameText);

    const info = new Text({
      text: `${player.actionsRemainingThisRound} actions • ${player.handCount} cartes${player.hasTakenThisRound ? ' • PRIS ✓' : ''}`,
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 11, fill: 0xb4b4d4, letterSpacing: 0.3 }),
    });
    info.position.set(x + padX, y + padY + 22);
    this.infoLayer.addChild(info);
  }

  private handleCardClick(card: Card) {
    if (!this.state || this.state.currentPlayerId !== this.playerId) return;
    sendAction({ type: 'PLAY_CARD', cardId: card.id });
  }

  flashMessage(msg: string, color = 0xff4444) {
    const W = this.W();
    const H = this.H();

    const toast = new Text({
      text: msg,
      style: new TextStyle({ fontFamily: 'Arial', fontSize: 15, fill: color, fontWeight: 'bold' }),
    });
    toast.anchor.set(0.5, 0.5);
    toast.position.set(W / 2, H / 2 - 40);
    this.root.addChild(toast);

    let elapsed = 0;
    const ticker = new Ticker();
    ticker.add((t) => {
      elapsed += t.deltaMS;
      toast.alpha = Math.max(0, 1 - elapsed / 2200);
      if (elapsed > 2200) {
        ticker.destroy();
        this.root.removeChild(toast);
      }
    });
    ticker.start();
  }

  destroy() {
    this.app.stage.removeChildren();
  }
}
