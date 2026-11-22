const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#82E0AA', '#F1948A', '#85C1E9'
];

export const getGameColor = (index: number) => COLORS[index % COLORS.length];

// Seeded only on a visitor's very first load (when no games key exists yet).
export const DEFAULT_GAMES: { name: string; appId: string }[] = [
  { name: 'Hades', appId: '1145360' },
  { name: 'Balatro', appId: '2379780' },
  { name: 'Stardew Valley', appId: '413150' },
  { name: 'Portal 2', appId: '620' },
  { name: 'Terraria', appId: '105600' },
  { name: 'Hollow Knight', appId: '367520' },
  { name: 'Elden Ring', appId: '1245620' },
  { name: 'Baldur\'s Gate 3', appId: '1086940' },
];
