import { describe, expect, it } from "vitest";

import { Party, PartyMember, StatBlock, TypeName, isTypeName } from "../src/types";
import { pokedex, pokedexByKo } from "../src/data";

describe("타입 스키마", () => {
  it("정상 PartyMember를 파싱한다", () => {
    const member = PartyMember.parse({
      species: "어써러셔",
      level: 50,
      nature: "신중",
      ability: "재생력",
      item: "구애조끼",
      teraType: "강철",
      moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
      evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
      ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
    });
    expect(member.species).toBe("어써러셔");
    expect(member.evs.H).toBe(252);
  });

  it("EV 합계가 510을 넘으면 거부한다", () => {
    expect(() =>
      PartyMember.parse({
        species: "어써러셔",
        level: 50,
        nature: "신중",
        ability: "재생력",
        teraType: "강철",
        moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
        evs: { H: 252, A: 252, B: 252, C: 0, D: 0, S: 0 },
        ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
      })
    ).toThrow();
  });

  it("Party는 최대 6마리까지 허용한다", () => {
    const member = {
      species: "어써러셔",
      level: 50,
      nature: "신중",
      ability: "재생력",
      teraType: "강철",
      moves: ["지진", "스톤에지", "기합구슬", "탁쳐서떨구기"],
      evs: { H: 252, A: 4, B: 0, C: 0, D: 252, S: 0 },
      ivs: { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 },
    };
    expect(() => Party.parse(Array(7).fill(member))).toThrow();
    expect(() => Party.parse(Array(6).fill(member))).not.toThrow();
  });

  it("isTypeName이 한국어 18타입을 모두 통과시킨다", () => {
    const all: TypeName[] = [
      "노말", "불꽃", "물", "풀", "전기", "얼음", "격투", "독",
      "땅", "비행", "에스퍼", "벌레", "바위", "고스트", "드래곤", "악",
      "강철", "페어리",
    ];
    for (const t of all) expect(isTypeName(t)).toBe(true);
    expect(isTypeName("스텔라")).toBe(false);
    expect(isTypeName("Steel")).toBe(false);
  });

  it("StatBlock의 모든 값은 0 이상 252 이하의 정수다", () => {
    expect(() => StatBlock.parse({ H: -1, A: 0, B: 0, C: 0, D: 0, S: 0 })).toThrow();
    expect(() => StatBlock.parse({ H: 253, A: 0, B: 0, C: 0, D: 0, S: 0 })).toThrow();
    expect(() => StatBlock.parse({ H: 100, A: 0, B: 0, C: 0, D: 0, S: 0 })).not.toThrow();
  });
});

describe("도감 데이터", () => {
  it("1025마리가 로드된다", () => {
    expect(pokedex.count).toBe(1025);
    expect(pokedex.entries).toHaveLength(1025);
  });

  it("한국어명으로 조회한다", () => {
    expect(pokedexByKo.get("이상해씨")?.no).toBe(1);
    expect(pokedexByKo.get("피카츄")?.no).toBe(25);
    expect(pokedexByKo.get("뮤츠")?.no).toBe(150);
    expect(pokedexByKo.get("복숭악동")?.no).toBe(1025);
  });

  it("모든 엔트리가 한국어명을 갖는다", () => {
    for (const entry of pokedex.entries) {
      expect(entry.ko).toBeTruthy();
      expect(entry.ko.length).toBeGreaterThan(0);
    }
  });

  it("모든 엔트리의 타입이 18타입 중 하나다", () => {
    for (const entry of pokedex.entries) {
      for (const t of entry.types) {
        expect([
          "노말", "불꽃", "물", "풀", "전기", "얼음", "격투", "독",
          "땅", "비행", "에스퍼", "벌레", "바위", "고스트", "드래곤", "악",
          "강철", "페어리",
        ]).toContain(t);
      }
    }
  });
});
