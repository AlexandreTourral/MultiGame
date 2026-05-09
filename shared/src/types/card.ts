export type SoutienType = 'INFORMATEUR' | 'PICKPOCKET' | 'SBIRE' | 'CAID';
export type CardType = 'SOUTIEN' | 'ALLIANCE' | 'TRAHISON' | 'VILLE';

export interface Card {
  id: string;
  type: CardType;
  soutienType?: SoutienType;
  pointValue?: number;
}
