export interface PlayCardAction {
  type: 'PLAY_CARD';
  cardId: string;
}

export interface TakeCardsAction {
  type: 'TAKE_CARDS';
}

export type PlayerAction = PlayCardAction | TakeCardsAction;
