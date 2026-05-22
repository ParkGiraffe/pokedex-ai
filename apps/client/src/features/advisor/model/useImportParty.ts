import { useMutation } from "@tanstack/react-query";

import { importPartyImage } from "../api";

export const useImportParty = () =>
  useMutation({ mutationFn: (image: string) => importPartyImage(image) });
