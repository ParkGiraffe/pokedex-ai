export type SpeedInput = {
  base: number;
  rank?: number;
  tailwind?: boolean;
  paralyzed?: boolean;
  stickyWeb?: boolean;
  itemMultiplier?: number;
  abilityMultiplier?: number;
};

const rankMultiplier = (rank: number): number => {
  if (rank >= 0) return (2 + rank) / 2;
  return 2 / (2 - rank);
};

export const effectiveSpeed = (input: SpeedInput): number => {
  const {
    base,
    rank = 0,
    tailwind = false,
    paralyzed = false,
    stickyWeb = false,
    itemMultiplier = 1,
    abilityMultiplier = 1,
  } = input;

  let value = Math.floor(base * rankMultiplier(rank));
  value = Math.floor(value * itemMultiplier);
  value = Math.floor(value * abilityMultiplier);
  if (stickyWeb) value = Math.floor((value * 2) / 3);
  if (paralyzed) value = Math.floor(value / 2);
  if (tailwind) value *= 2;
  return value;
};

export type FasterResult = 'left' | 'right' | 'tie';

export const fasterSide = (speeds: { left: number; right: number }, options: { trickRoom: boolean }): FasterResult => {
  if (speeds.left === speeds.right) return 'tie';
  const leftWins = options.trickRoom ? speeds.left < speeds.right : speeds.left > speeds.right;
  return leftWins ? 'left' : 'right';
};
