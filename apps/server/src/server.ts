import {
  counterplay,
  type EngineField,
  inBattle,
  type MyMon,
  teamSelect,
} from "@pokedex-agent/battle-engine";
import Fastify, { type FastifyInstance } from "fastify";

import { CounterBody, DecideBody, ImportPartyBody, TeamSelectBody } from "./dto";
import { buildImportResult, extractPartyFromImage, mergeMembers } from "./import";

export const buildServer = (): FastifyInstance => {
  const app = Fastify({ logger: false, bodyLimit: 12 * 1024 * 1024 });

  app.get("/health", async () => ({ ok: true }));

  // 파티 화면 이미지(여러 장 가능) → Claude 비전 → 종족 기준 병합 → 검증된 파티(빌더 형식)
  app.post("/import-party", async (request) => {
    const body = ImportPartyBody.parse(request.body);
    const sources = body.images ?? (body.image ? [body.image] : []);
    const images = sources.map((source) => source.replace(/^data:image\/[a-zA-Z+]+;base64,/, ""));
    // Claude API는 동시 요청 가능 — 여러 장 병렬 처리해 응답 시간 단축.
    const lists = await Promise.all(images.map((image) => extractPartyFromImage(image)));
    return buildImportResult(mergeMembers(lists));
  });

  // 선출: 내 팀 × 상대 팀 매치업 점수로 선출 우선순위.
  app.post("/team-select", async (request) => {
    const body = TeamSelectBody.parse(request.body);
    const board = teamSelect(body.myTeam as MyMon[], body.opponentTeam, body.field as EngineField);
    const top = board[0];
    return {
      board,
      summary: top
        ? `${top.myPick} 선출 추천 (점수 ${top.score.toFixed(2)}, 유리 ${top.favorable}/불리 ${top.unfavorable})`
        : "추천 불가",
    };
  });

  // 인배틀: 현재 액티브의 기술/교체 추천.
  app.post("/decide", async (request) => {
    const body = DecideBody.parse(request.body);
    const advice = inBattle(
      body.active as MyMon,
      body.opponentSpecies,
      body.bench as MyMon[],
      body.field as EngineField
    );
    return { ...advice, summary: advice.recommendation };
  });

  // 파훼: 상대 종족의 흔한 세트별 카운터.
  app.post("/counter", async (request) => {
    const body = CounterBody.parse(request.body);
    const entries = counterplay(body.opponentSpecies, body.myPool as MyMon[], body.field as EngineField);
    return { opponent: body.opponentSpecies, entries };
  });

  app.setErrorHandler((error, _request, reply) => {
    reply.status(400).send({ error: error instanceof Error ? error.message : String(error) });
  });

  return app;
};
