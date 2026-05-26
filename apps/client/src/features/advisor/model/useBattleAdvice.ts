import type { BattleState } from "@pokedex-agent/pokedex-core";
import { useMutation } from "@tanstack/react-query";

import { requestBattleAdvice } from "../api";

export const useBattleAdvice = () =>
  useMutation({ mutationFn: (state: BattleState) => requestBattleAdvice(state) });
