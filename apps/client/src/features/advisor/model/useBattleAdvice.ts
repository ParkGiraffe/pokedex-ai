import type { BattleState } from "@pokedex-agent/pokedex-core";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { requestBattleAdvice } from "../api";

export const useBattleAdvice = () =>
  useMutation({
    mutationFn: (state: BattleState) => requestBattleAdvice(state),
    onSuccess: () => toast.success("배틀 추천 완료"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "배틀 추천 실패"),
  });
