import type { BattleState } from "@pokedex-agent/pokedex-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type MegaFormSelection, requestMatchupLeadrec } from "../api";

type MatchupLeadrecInput = {
  state: BattleState;
  megaForms?: MegaFormSelection;
};

export const useMatchupLeadrec = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ state, megaForms }: MatchupLeadrecInput) => requestMatchupLeadrec(state, megaForms),
    onSuccess: () => toast.success("선두 추천 완료"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "매치업 분석 실패"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["quota"] }),
  });
};
