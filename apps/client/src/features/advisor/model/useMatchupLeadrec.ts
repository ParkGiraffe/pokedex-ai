import type { BattleState } from "@pokedex-agent/pokedex-core";
import { useMutation } from "@tanstack/react-query";

import { requestMatchupLeadrec } from "../api";

export const useMatchupLeadrec = () =>
  useMutation({ mutationFn: (state: BattleState) => requestMatchupLeadrec(state) });
