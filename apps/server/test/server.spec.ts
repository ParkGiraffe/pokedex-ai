import { describe, expect, it } from "vitest";

import { buildServer } from "../src/server";

describe("어드바이저 서버", () => {
  it("헬스체크", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("/decide: 기술 옵션과 추천을 반환한다", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/decide",
      payload: {
        active: {
          species: "한카리아스",
          moves: ["지진", "역린", "스톤에지", "불꽃엄니"],
          nature: "고집",
          evs: { atk: 252, spe: 252 },
        },
        opponentSpecies: "마기라스",
        bench: [],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.moveOptions.length).toBeGreaterThan(0);
    expect(body.summary).toBeTruthy();
  });

  it("/team-select: 선출 점수를 반환한다", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/team-select",
      payload: {
        myTeam: [{ species: "한카리아스", moves: ["지진", "역린"] }],
        opponentTeam: ["라이츄"],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().board).toHaveLength(1);
  });

  it("/counter: 상대 세트 카운터를 반환한다", async () => {
    const app = buildServer();
    const res = await app.inject({
      method: "POST",
      url: "/counter",
      payload: {
        opponentSpecies: "위대한엄니",
        myPool: [{ species: "한카리아스", moves: ["지진"] }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().entries.length).toBeGreaterThan(0);
  });

  it("/decide: 메가진화 입력이 DTO를 통과해 데미지에 반영된다", async () => {
    const app = buildServer();
    const base = { species: "한카리아스", moves: ["지진"], nature: "고집", evs: { atk: 252 } };
    const plain = await app.inject({
      method: "POST",
      url: "/decide",
      payload: { active: base, opponentSpecies: "마기라스", bench: [] },
    });
    const mega = await app.inject({
      method: "POST",
      url: "/decide",
      payload: { active: { ...base, mega: true }, opponentSpecies: "마기라스", bench: [] },
    });
    expect(mega.json().moveOptions[0].max).toBeGreaterThan(plain.json().moveOptions[0].max);
  });

  it("잘못된 본문은 400", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "POST", url: "/decide", payload: {} });
    expect(res.statusCode).toBe(400);
  });
});
