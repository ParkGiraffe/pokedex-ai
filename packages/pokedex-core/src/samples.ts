import samplesRaw from "../data/champions/samples-singles.json" with { type: "json" };
import { pokedexByKo } from "./data";
import { abilityKoByEn, moveKoByEn } from "./lookup";

type SampleSet = {
  nameKo: string;
  nameEn: string;
  ability: string;
  item: string;
  moves: Array<string | null>;
  megaForm: string;
};

const byPokemon = (samplesRaw as unknown as { byPokemon: Record<string, SampleSet[]> }).byPokemon;

export type OpponentHint = {
  species: string;
  abilities: string[]; // 정식 한국명, 빈도 내림차순
  moves: string[]; // 정식 한국명, 빈도 내림차순
};

const topByCount = (counts: Map<string, number>, limit: number): string[] =>
  [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([key]) => key);

// 종족(한국명)의 흔한 특성·기술을 샘플 세트에서 집계해 정식 한국명으로 반환한다.
// 영문→한국 변환에 실패한 항목은 버려서(undefined) 음역·미검증 명칭이 프롬프트에 새지 않게 한다.
export const opponentSetHint = (speciesKo: string): OpponentHint | undefined => {
  const entry = pokedexByKo.get(speciesKo);
  if (!entry) {
    return undefined;
  }
  const sets = byPokemon[String(entry.no)];
  if (!sets || sets.length === 0) {
    return undefined;
  }
  const abilityCount = new Map<string, number>();
  const moveCount = new Map<string, number>();
  for (const set of sets) {
    const abilityKo = abilityKoByEn(set.ability);
    if (abilityKo) {
      abilityCount.set(abilityKo, (abilityCount.get(abilityKo) ?? 0) + 1);
    }
    for (const move of set.moves) {
      if (!move) {
        continue;
      }
      const moveKo = moveKoByEn(move);
      if (moveKo) {
        moveCount.set(moveKo, (moveCount.get(moveKo) ?? 0) + 1);
      }
    }
  }
  const abilities = topByCount(abilityCount, 2);
  const moves = topByCount(moveCount, 6);
  if (abilities.length === 0 && moves.length === 0) {
    return undefined;
  }
  return { species: speciesKo, abilities, moves };
};
