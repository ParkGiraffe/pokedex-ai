import { Module } from "@nestjs/common";

import { BattleController } from "./battle.controller";

@Module({
  controllers: [BattleController],
})
export class BattleModule {}
