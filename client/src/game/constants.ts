import type { SoutienType, CardType } from '@district-noir/shared';

export const CARD_WIDTH = 76;
export const CARD_HEIGHT = 114;
export const CARD_RADIUS = 7;

export const SOUTIEN_COLORS: Record<SoutienType, number> = {
  INFORMATEUR: 0x2196f3,
  PICKPOCKET: 0x4caf50,
  SBIRE: 0xff9800,
  CAID: 0x9c27b0,
};

export const SOUTIEN_LABELS: Record<SoutienType, string> = {
  INFORMATEUR: 'INFORMATEUR',
  PICKPOCKET: 'PICKPOCKET',
  SBIRE: 'SBIRE',
  CAID: 'CAÏD',
};

export const SOUTIEN_VALUES_DISPLAY: Record<SoutienType, number> = {
  INFORMATEUR: 5,
  PICKPOCKET: 6,
  SBIRE: 7,
  CAID: 8,
};

export const TYPE_COLORS: Record<CardType, number> = {
  SOUTIEN: 0x3a3a5a,
  ALLIANCE: 0xffd700,
  TRAHISON: 0x8b0000,
  VILLE: 0x607d8b,
};
