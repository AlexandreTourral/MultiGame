export type GameEntry = {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  available: boolean;
  tags?: string[];
};

export const GAMES: GameEntry[] = [
  {
    id: 'district-noir',
    title: 'District Noir',
    subtitle: 'Jeu de cartes en ligne à 2 joueurs',
    path: '/district-noir',
    available: true,
    tags: ['multijoueur', 'cartes'],
  },
];
