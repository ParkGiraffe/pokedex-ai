import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createPreset } from "../api";

export const useSavePreset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      toast.success("프리셋을 저장했습니다");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "프리셋 저장 실패"),
  });
};
