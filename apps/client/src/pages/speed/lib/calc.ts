import { findPokemon, formula } from "@pokedex-agent/pokedex-core";

import { type SpeedSide } from "../model/store";

export const computeSpeed = (side: SpeedSide): number | undefined => {
  const entry = findPokemon(side.species);
  if (!entry) {
    return undefined;
  }
  const raw = formula.actualStat({
    stat: "S",
    base: entry.base.S,
    iv: 31,
    ev: side.ev,
    level: side.level,
    nature: side.nature,
  });
  return formula.effectiveSpeed({
    base: raw,
    rank: side.rank,
    tailwind: side.tailwind,
    paralyzed: side.paralyzed,
    stickyWeb: side.stickyWeb,
    itemMultiplier: side.itemMultiplier,
    abilityMultiplier: side.abilityMultiplier,
  });
};

export type SpeedComparison = {
  left: number;
  right: number;
  faster: formula.FasterResult;
};

export const compareSpeed = (
  left: SpeedSide,
  right: SpeedSide,
  trickRoom: boolean
): SpeedComparison | undefined => {
  const leftSpeed = computeSpeed(left);
  const rightSpeed = computeSpeed(right);
  if (leftSpeed === undefined || rightSpeed === undefined) {
    return undefined;
  }
  return {
    left: leftSpeed,
    right: rightSpeed,
    faster: formula.fasterSide({ left: leftSpeed, right: rightSpeed }, { trickRoom }),
  };
};

export const buildSpeedMarkdown = (
  left: SpeedSide,
  right: SpeedSide,
  comparison: SpeedComparison,
  trickRoom: boolean
): string =>
  [
    "## 작업: 스피드 상황 분석",
    "",
    `- 좌: ${left.species} 실스피드 ${comparison.left}`,
    `- 우: ${right.species} 실스피드 ${comparison.right}`,
    `- 트릭룸: ${trickRoom ? "활성" : "비활성"}`,
    `- 선공: ${comparison.faster === "tie" ? "동률" : comparison.faster === "left" ? left.species : right.species}`,
    "",
    "## 요청",
    "- 이 스피드 라인의 의미(빗치기, 스카프 견제 등)를 한국 SV 어휘로 분석",
    "- 응답 마지막에 표준 JSON 코드블록을 반드시 포함",
  ].join("\n");
