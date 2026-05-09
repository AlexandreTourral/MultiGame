import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card } from '@district-noir/shared';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_RADIUS,
  SOUTIEN_COLORS,
  SOUTIEN_LABELS,
  SOUTIEN_VALUES_DISPLAY,
  TYPE_COLORS,
} from './constants';

export interface CardSpriteOptions {
  card: Card;
  faceUp?: boolean;
  interactive?: boolean;
  onSelect?: (card: Card) => void;
}

export class CardSprite extends Container {
  public card: Card;
  public selected: boolean = false;
  public faceUp: boolean;
  private onSelect?: (card: Card) => void;

  constructor({ card, faceUp = true, interactive = false, onSelect }: CardSpriteOptions) {
    super();
    this.card = card;
    this.faceUp = faceUp;
    this.onSelect = onSelect;
    this.draw();

    if (interactive) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
      this.on('pointerover', () => { if (!this.selected) this.scale.set(1.07); });
      this.on('pointerout', () => { if (!this.selected) this.scale.set(1); });
      this.on('pointertap', () => this.onSelect?.(this.card));
    }
  }

  draw() {
    this.removeChildren();

    if (!this.faceUp) {
      this.drawBack();
      return;
    }

    switch (this.card.type) {
      case 'SOUTIEN': this.drawSoutien(); break;
      case 'ALLIANCE': this.drawAlliance(); break;
      case 'TRAHISON': this.drawTrahison(); break;
      case 'VILLE': this.drawVille(); break;
    }

    if (this.selected) {
      const outline = new Graphics();
      outline.roundRect(-3, -3, CARD_WIDTH + 6, CARD_HEIGHT + 6, CARD_RADIUS + 2);
      outline.stroke({ width: 3, color: 0xffd700 });
      this.addChild(outline);
    }
  }

  private makeBase(borderColor: number, fillColor = 0x0d1117): Graphics {
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    bg.fill(fillColor);
    bg.stroke({ width: 2, color: borderColor });
    this.addChild(bg);
    return bg;
  }

  private drawBack() {
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    bg.fill(0x12122a);
    bg.stroke({ width: 1, color: 0x333366 });
    this.addChild(bg);

    for (let x = 10; x < CARD_WIDTH; x += 14) {
      for (let y = 10; y < CARD_HEIGHT; y += 14) {
        const dot = new Graphics();
        dot.circle(x, y, 1.5);
        dot.fill(0x1e1e40);
        this.addChild(dot);
      }
    }

    const lbl = new Text({ text: 'DN', style: new TextStyle({ fontFamily: 'Georgia', fontSize: 15, fill: 0x4a5088, fontWeight: 'bold' }) });
    lbl.anchor.set(0.5);
    lbl.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    this.addChild(lbl);
  }

  private drawSoutien() {
    const type = this.card.soutienType!;
    const color = SOUTIEN_COLORS[type];
    const value = SOUTIEN_VALUES_DISPLAY[type];

    this.makeBase(color);

    const bar = new Graphics();
    bar.roundRect(0, 0, CARD_WIDTH, 26, CARD_RADIUS);
    bar.fill(color);
    this.addChild(bar);

    const corner = new Graphics();
    corner.roundRect(0, CARD_HEIGHT - 26, CARD_WIDTH, 26, CARD_RADIUS);
    corner.fill({ color, alpha: 0.3 });
    this.addChild(corner);

    const typeText = new Text({ text: SOUTIEN_LABELS[type], style: new TextStyle({ fontFamily: 'Arial', fontSize: 8, fill: 0xffffff, fontWeight: 'bold', letterSpacing: 0.5 }) });
    typeText.anchor.set(0.5, 0.5);
    typeText.position.set(CARD_WIDTH / 2, 13);
    this.addChild(typeText);

    const valueText = new Text({ text: String(value), style: new TextStyle({ fontFamily: 'Georgia', fontSize: 36, fill: color, fontWeight: 'bold' }) });
    valueText.anchor.set(0.5, 0.5);
    valueText.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 6);
    this.addChild(valueText);

    const ptText = new Text({ text: 'pts', style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0x9292b8 }) });
    ptText.anchor.set(0.5, 0);
    ptText.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 26);
    this.addChild(ptText);

    const soutienLabel = new Text({ text: 'SOUTIEN', style: new TextStyle({ fontFamily: 'Arial', fontSize: 7, fill: 0xb0b0b8, letterSpacing: 1 }) });
    soutienLabel.anchor.set(0.5, 0.5);
    soutienLabel.position.set(CARD_WIDTH / 2, CARD_HEIGHT - 13);
    this.addChild(soutienLabel);
  }

  private drawAlliance() {
    this.makeBase(0xffd700, 0x0a0a0f);

    const glow = new Graphics();
    glow.roundRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6, CARD_RADIUS - 1);
    glow.fill({ color: 0xffd700, alpha: 0.06 });
    this.addChild(glow);

    const header = new Graphics();
    header.roundRect(0, 0, CARD_WIDTH, 26, CARD_RADIUS);
    header.fill({ color: 0xffd700, alpha: 0.85 });
    this.addChild(header);

    const typeText = new Text({ text: 'ALLIANCE', style: new TextStyle({ fontFamily: 'Arial', fontSize: 8, fill: 0x000000, fontWeight: 'bold', letterSpacing: 1 }) });
    typeText.anchor.set(0.5, 0.5);
    typeText.position.set(CARD_WIDTH / 2, 13);
    this.addChild(typeText);

    const valueText = new Text({ text: `+${this.card.pointValue}`, style: new TextStyle({ fontFamily: 'Georgia', fontSize: 32, fill: 0xffd700, fontWeight: 'bold' }) });
    valueText.anchor.set(0.5, 0.5);
    valueText.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 8);
    this.addChild(valueText);

    const ptText = new Text({ text: 'points', style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0xb8b898 }) });
    ptText.anchor.set(0.5, 0);
    ptText.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 26);
    this.addChild(ptText);
  }

  private drawTrahison() {
    this.makeBase(0xcc2222, 0x0a0a0f);

    const glow = new Graphics();
    glow.roundRect(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6, CARD_RADIUS - 1);
    glow.fill({ color: 0xcc2222, alpha: 0.08 });
    this.addChild(glow);

    const header = new Graphics();
    header.roundRect(0, 0, CARD_WIDTH, 26, CARD_RADIUS);
    header.fill(0x8b0000);
    this.addChild(header);

    const typeText = new Text({ text: 'TRAHISON', style: new TextStyle({ fontFamily: 'Arial', fontSize: 8, fill: 0xffaaaa, fontWeight: 'bold', letterSpacing: 1 }) });
    typeText.anchor.set(0.5, 0.5);
    typeText.position.set(CARD_WIDTH / 2, 13);
    this.addChild(typeText);

    const val = this.card.pointValue ?? 0;
    const valueText = new Text({ text: `${val}`, style: new TextStyle({ fontFamily: 'Georgia', fontSize: 32, fill: 0xff4444, fontWeight: 'bold' }) });
    valueText.anchor.set(0.5, 0.5);
    valueText.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 8);
    this.addChild(valueText);

    const ptText = new Text({ text: 'points', style: new TextStyle({ fontFamily: 'Arial', fontSize: 9, fill: 0xa88080 }) });
    ptText.anchor.set(0.5, 0);
    ptText.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 26);
    this.addChild(ptText);
  }

  private drawVille() {
    this.makeBase(0x607d8b, 0x0a0a0f);

    const header = new Graphics();
    header.roundRect(0, 0, CARD_WIDTH, 26, CARD_RADIUS);
    header.fill(0x455a64);
    this.addChild(header);

    const typeText = new Text({ text: 'VILLE', style: new TextStyle({ fontFamily: 'Arial', fontSize: 8, fill: 0xcfd8dc, fontWeight: 'bold', letterSpacing: 2 }) });
    typeText.anchor.set(0.5, 0.5);
    typeText.position.set(CARD_WIDTH / 2, 13);
    this.addChild(typeText);

    const cityIcon = new Text({ text: '🏙', style: new TextStyle({ fontSize: 28 }) });
    cityIcon.anchor.set(0.5, 0.5);
    cityIcon.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2 + 6);
    this.addChild(cityIcon);

    const desc = new Text({ text: 'Réunis 3\npour gagner !', style: new TextStyle({ fontFamily: 'Arial', fontSize: 8, fill: 0x7a9aaa, align: 'center' }) });
    desc.anchor.set(0.5, 1);
    desc.position.set(CARD_WIDTH / 2, CARD_HEIGHT - 6);
    this.addChild(desc);
  }

  setSelected(val: boolean) {
    this.selected = val;
    this.draw();
    this.y = val ? -14 : 0;
    if (val) this.scale.set(1);
  }
}
