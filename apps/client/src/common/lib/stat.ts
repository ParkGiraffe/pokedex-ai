// 스탯 키(H/A/B/C/D/S) → 한국어 라벨. 노력치·종족값 등 6스탯 표시에 공용으로 쓴다.
// 랭크는 HP가 없어 A~S만 쓴다.
export const STAT_LABEL_KO: Record<"H" | "A" | "B" | "C" | "D" | "S", string> = {
  H: "HP",
  A: "공격",
  B: "방어",
  C: "특공",
  D: "특방",
  S: "스피드",
};
