export type SpeedInput = {
  base: number;
  rank?: number; // -6..+6
  tailwind?: boolean;
  paralyzed?: boolean;
  stickyWeb?: boolean;
  itemMultiplier?: number; // 구애스카프 1.5, 두꺼운자루 0.5 등
  abilityMultiplier?: number; // 가속 1.5, 모래헤치기 2.0 등 (날씨·특성)
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
  // 끈적네트는 스피드 1랭크 다운(= 2/3배), 1/3배가 아니다.
  if (stickyWeb) value = Math.floor((value * 2) / 3);
  if (paralyzed) value = Math.floor(value / 2);
  if (tailwind) value *= 2;
  return value;
};

export type FasterResult = "left" | "right" | "tie";

export const fasterSide = (
  speeds: { left: number; right: number },
  options: { trickRoom: boolean }
): FasterResult => {
  if (speeds.left === speeds.right) return "tie";
  const leftWins = options.trickRoom ? speeds.left < speeds.right : speeds.left > speeds.right;
  return leftWins ? "left" : "right";
};
