import { type NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.factory";

// 기존 Fastify 서버와 동일 입출력을 NestJS에서 재현하는 동등성 테스트.
// Anthropic을 호출하는 엔드포인트(/analyze-party·/import-party 등)는 외부 의존이라 제외.
describe("어드바이저 서버 (NestJS 동등성)", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("헬스체크", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("/decide: 기술 옵션과 추천을 반환한다", async () => {
    const res = await request(app.getHttpServer())
      .post("/decide")
      .send({
        active: {
          species: "한카리아스",
          moves: ["지진", "역린", "스톤에지", "불꽃엄니"],
          nature: "고집",
          evs: { atk: 252, spe: 252 },
        },
        opponentSpecies: "마기라스",
        bench: [],
      });
    expect(res.status).toBe(200);
    expect(res.body.moveOptions.length).toBeGreaterThan(0);
    expect(res.body.summary).toBeTruthy();
  });

  it("/team-select: 선출 점수를 반환한다", async () => {
    const res = await request(app.getHttpServer())
      .post("/team-select")
      .send({
        myTeam: [{ species: "한카리아스", moves: ["지진", "역린"] }],
        opponentTeam: ["라이츄"],
      });
    expect(res.status).toBe(200);
    expect(res.body.board).toHaveLength(1);
  });

  it("/counter: 상대 세트 카운터를 반환한다", async () => {
    const res = await request(app.getHttpServer())
      .post("/counter")
      .send({
        opponentSpecies: "위대한엄니",
        myPool: [{ species: "한카리아스", moves: ["지진"] }],
      });
    expect(res.status).toBe(200);
    expect(res.body.entries.length).toBeGreaterThan(0);
  });

  it("/decide: 메가진화 입력이 DTO를 통과해 데미지에 반영된다", async () => {
    const base = { species: "한카리아스", moves: ["지진"], nature: "고집", evs: { atk: 252 } };
    const plain = await request(app.getHttpServer())
      .post("/decide")
      .send({ active: base, opponentSpecies: "마기라스", bench: [] });
    const mega = await request(app.getHttpServer())
      .post("/decide")
      .send({ active: { ...base, mega: true }, opponentSpecies: "마기라스", bench: [] });
    expect(mega.body.moveOptions[0].max).toBeGreaterThan(plain.body.moveOptions[0].max);
  });

  it("잘못된 본문은 400", async () => {
    const res = await request(app.getHttpServer()).post("/decide").send({});
    expect(res.status).toBe(400);
  });
});
