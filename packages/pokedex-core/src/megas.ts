import megasRaw from "../data/champions/megas.json" with { type: "json" };
import championsItemsRaw from "../data/champions/items.json" with { type: "json" };
import type { BaseStatBlock, TypeName } from "./types";

// 메가 의무도. Smogon 챔피언스 사용률(2026-04) 기반.
// obligatory: 메가 안 하면 거의 안 쓰임 / flexible: 비메가도 흔히 활용 / fringe: 양쪽 비주류 / unknown: 챔피언스 미등장
export type MegaPriority = "obligatory" | "flexible" | "fringe" | "unknown";

export type MegaForm = {
  stone: string;
  form: string;
  baseNo: number;
  baseKo: string;
  ko: string;
  en: string;
  types: TypeName[];
  base: BaseStatBlock;
  ability: string;
  megaForme: "X" | "Y" | null;
  megaPriority?: MegaPriority;
};

export type ChampionsItem = { slug: string; ko: string; isMega: boolean; megaForme?: "X" | "Y" };

const megas = (megasRaw as { megas: MegaForm[] }).megas;
export const championsItems = (championsItemsRaw as { items: ChampionsItem[] }).items;

const byBaseKo = new Map<string, MegaForm[]>();
const byStone = new Map<string, MegaForm>();
for (const mega of megas) {
  const list = byBaseKo.get(mega.baseKo) ?? [];
  list.push(mega);
  byBaseKo.set(mega.baseKo, list);
  byStone.set(mega.stone, mega);
}

const stoneByItemKo = new Map<string, string>();
// items.json의 slug와 megas.json의 stone이 fetch 스크립트 오타로 어긋난 경우(예: dragonitite ≠ dragoniteite)를
// 잡기 위해, 메가 도구의 한국어명을 baseKo 기반 폼으로도 매핑해 둔다.
const megaByItemKo = new Map<string, MegaForm>();
for (const item of championsItems) {
  if (!item.isMega) {
    continue;
  }
  stoneByItemKo.set(item.ko, item.slug);
  // "망나뇽나이트" → "망나뇽" 식으로 끝의 "나이트"를 떼어 베이스 종족을 추정해 본다.
  const baseGuess = item.ko.endsWith("나이트") ? item.ko.slice(0, -3) : null;
  if (!baseGuess) {
    continue;
  }
  const candidates = byBaseKo.get(baseGuess) ?? [];
  if (candidates.length === 1) {
    megaByItemKo.set(item.ko, candidates[0]!);
  } else if (item.megaForme) {
    const matched = candidates.find((c) => c.megaForme === item.megaForme);
    if (matched) {
      megaByItemKo.set(item.ko, matched);
    }
  }
}

// 종족 한국어명으로 가능한 메가 폼 목록 (리자몽은 X/Y 두 개, 그 외는 보통 1개).
export const findMegasBySpecies = (species: string): MegaForm[] => byBaseKo.get(species) ?? [];

// 메가 폼(슬러그)이 선택돼 있으면 메가 표시명(예: 메가리자몽X), 아니면 종족명을 돌려준다.
export const speciesDisplayName = (species: string, megaForm?: string): string => {
  if (!megaForm) {
    return species;
  }
  return byBaseKo.get(species)?.find((mega) => mega.form === megaForm)?.ko ?? species;
};

// 메가스톤 슬러그로 단일 메가 폼 결정.
export const findMegaByStone = (stone: string): MegaForm | undefined => byStone.get(stone);

// 도구 한국어명으로 단일 메가 폼 결정 (예: "메가핫삼나이트" → 메가핫삼).
// 1) items.slug ↔ megas.stone 직매칭 우선. 2) 어긋나면 baseKo 추정 매핑으로 fallback.
export const findMegaByItem = (itemKo: string): MegaForm | undefined => {
  const stone = stoneByItemKo.get(itemKo);
  if (stone) {
    const direct = byStone.get(stone);
    if (direct) {
      return direct;
    }
  }
  return megaByItemKo.get(itemKo);
};

export const allMegas = (): readonly MegaForm[] => megas;
