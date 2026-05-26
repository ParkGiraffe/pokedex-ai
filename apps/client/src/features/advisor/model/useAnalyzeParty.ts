import type { Party } from "@pokedex-agent/pokedex-core";
import { useMutation } from "@tanstack/react-query";

import { requestPartyAnalysis } from "../api";

export const useAnalyzeParty = () =>
  useMutation({ mutationFn: (party: Party) => requestPartyAnalysis(party) });
