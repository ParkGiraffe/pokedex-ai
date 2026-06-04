import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
  counterplay,
  type EngineField,
  inBattle,
  type MyMon,
  teamSelect,
} from "@pokedex-agent/battle-engine";

import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  CounterBody,
  type CounterInput,
  DecideBody,
  type DecideInput,
  TeamSelectBody,
  type TeamSelectInput,
} from "../dto";

@Controller()
export class BattleController {
  // 선출: 내 팀 × 상대 팀 매치업 점수로 선출 우선순위.
  @Post("team-select")
  @HttpCode(200)
  teamSelect(@Body(new ZodValidationPipe(TeamSelectBody)) body: TeamSelectInput) {
    const board = teamSelect(body.myTeam as MyMon[], body.opponentTeam, body.field as EngineField);
    const top = board[0];
    return {
      board,
      summary: top
        ? `${top.myPick} 선출 추천 (점수 ${top.score.toFixed(2)}, 유리 ${top.favorable}/불리 ${top.unfavorable})`
        : "추천 불가",
    };
  }

  // 인배틀: 현재 액티브의 기술/교체 추천.
  @Post("decide")
  @HttpCode(200)
  decide(@Body(new ZodValidationPipe(DecideBody)) body: DecideInput) {
    const advice = inBattle(
      body.active as MyMon,
      body.opponentSpecies,
      body.bench as MyMon[],
      body.field as EngineField
    );
    return { ...advice, summary: advice.recommendation };
  }

  // 파훼: 상대 종족의 흔한 세트별 카운터.
  @Post("counter")
  @HttpCode(200)
  counter(@Body(new ZodValidationPipe(CounterBody)) body: CounterInput) {
    const entries = counterplay(body.opponentSpecies, body.myPool as MyMon[], body.field as EngineField);
    return { opponent: body.opponentSpecies, entries };
  }
}
