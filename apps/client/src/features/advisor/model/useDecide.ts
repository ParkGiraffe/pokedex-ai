import { useMutation } from "@tanstack/react-query";

import { type DecideBody, requestDecision } from "../api";

export const useDecide = () =>
  useMutation({ mutationFn: (body: DecideBody) => requestDecision(body) });
