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

const assertKnownSpecies = (names: ReadonlyArray<string>): void => {
  const unknown = [...new Set(names.filter((name) => name && !findPokemon(name)))];
  if (unknown.length > 0) {
    throw new BadRequestException(`알 수 없는 포켓몬: ${unknown.join(', ')}`);
  }
};

@Controller()
export class BattleController {
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

  @Post('decide')
  @HttpCode(200)
  decide(
    @Body(new ZodValidationPipe(DecideBody)) body: DecideInput,
  ): ReturnType<typeof inBattle> & { summary: string } {
    assertKnownSpecies([body.active.species, body.opponentSpecies, ...body.bench.map((mon) => mon.species)]);
    const advice = inBattle(body.active, body.opponentSpecies, body.bench, body.field);
    return { ...advice, summary: advice.recommendation };
  }

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
