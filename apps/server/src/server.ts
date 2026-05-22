import {
  counterplay,
  type EngineField,
  inBattle,
  type MyMon,
  teamSelect,
} from "@pokedex-agent/battle-engine";
import Fastify, { type FastifyInstance } from "fastify";

import { CounterBody, DecideBody, TeamSelectBody } from "./dto";

export const buildServer = (): FastifyInstance => {
  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ ok: true }));

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
