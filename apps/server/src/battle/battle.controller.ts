import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { counterplay, inBattle, teamSelect } from '@pokedex-agent/battle-engine';
import { findPokemon } from '@pokedex-agent/pokedex-core';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  CounterBody,
  type CounterInput,
  DecideBody,
  type DecideInput,
  TeamSelectBody,
  type TeamSelectInput,
} from '../dto';

// 입력 종족이 도감에 있는지 검증한다. 오타·미존재 종족(예: 또가스 오타)이 @smogon/calc에 닿으면
// "Cannot read properties of undefined (reading 'hp')"로 크래시하므로, 그 전에 친절한 400으로 막는다.
const assertKnownSpecies = (names: ReadonlyArray<string>): void => {
  const unknown = [...new Set(names.filter((name) => name && !findPokemon(name)))];
  if (unknown.length > 0) {
    throw new BadRequestException(`알 수 없는 포켓몬: ${unknown.join(', ')}`);
  }
};

@Controller()
export class BattleController {
  // 선출: 내 팀 × 상대 팀 매치업 점수로 선출 우선순위.
  @Post('team-select')
  @HttpCode(200)
  teamSelect(@Body(new ZodValidationPipe(TeamSelectBody)) body: TeamSelectInput): {
    board: ReturnType<typeof teamSelect>;
    summary: string;
  } {
    assertKnownSpecies([...body.myTeam.map((mon) => mon.species), ...body.opponentTeam]);
    const board = teamSelect(body.myTeam, body.opponentTeam, body.field);
    const top = board[0];
    return {
      board,
      summary: top
        ? `${top.myPick} 선출 추천 (점수 ${top.score.toFixed(2)}, 유리 ${top.favorable}/불리 ${top.unfavorable})`
        : '추천 불가',
    };
  }

  // 인배틀: 현재 액티브의 기술/교체 추천.
  @Post('decide')
  @HttpCode(200)
  decide(
    @Body(new ZodValidationPipe(DecideBody)) body: DecideInput,
  ): ReturnType<typeof inBattle> & { summary: string } {
    assertKnownSpecies([body.active.species, body.opponentSpecies, ...body.bench.map((mon) => mon.species)]);
    const advice = inBattle(body.active, body.opponentSpecies, body.bench, body.field);
    return { ...advice, summary: advice.recommendation };
  }

  // 파훼: 상대 종족의 흔한 세트별 카운터.
  @Post('counter')
  @HttpCode(200)
  counter(@Body(new ZodValidationPipe(CounterBody)) body: CounterInput): {
    opponent: string;
    entries: ReturnType<typeof counterplay>;
  } {
    assertKnownSpecies([body.opponentSpecies, ...body.myPool.map((mon) => mon.species)]);
    const entries = counterplay(body.opponentSpecies, body.myPool, body.field);
    return { opponent: body.opponentSpecies, entries };
  }
}
