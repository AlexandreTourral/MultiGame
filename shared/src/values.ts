import type { SoutienType } from './types/card';

export const SOUTIEN_VALUES: Record<SoutienType, number> = {
  INFORMATEUR: 5,
  PICKPOCKET: 6,
  SBIRE: 7,
  CAID: 8,
};

export const SOUTIEN_LABELS: Record<SoutienType, string> = {
  INFORMATEUR: 'Informateur',
  PICKPOCKET: 'Pickpocket',
  SBIRE: 'Sbire',
  CAID: 'Caïd',
};

export const SERIE_SIZE = 4;
export const SERIE_BONUS = 5;
export const VILLE_WIN_COUNT = 3;
export const ACTIONS_PER_ROUND = 6;
export const MAX_ROUNDS = 4;
