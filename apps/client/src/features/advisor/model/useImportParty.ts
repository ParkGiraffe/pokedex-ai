import { useMutation } from "@tanstack/react-query";

import { importPartyImages } from "../api";

export const useImportParty = () =>
  useMutation({ mutationFn: (images: string[]) => importPartyImages(images) });
