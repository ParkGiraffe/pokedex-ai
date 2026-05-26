import {
  type BattleState,
  type ExportTask,
  type Party,
  serializeForClaude,
} from "@pokedex-agent/pokedex-core";
import { toast } from "sonner";

import { Button } from "@/common/ui/Button";

type ExportButtonProps = {
  task: ExportTask;
  payload: { party?: Party; state?: BattleState };
  label?: string;
};

export const ExportButton = ({ task, payload, label = "Claude에 분석 요청" }: ExportButtonProps) => {
  const handleExport = async () => {
    try {
      const text = serializeForClaude(task, payload);
      await navigator.clipboard.writeText(text);
      toast.success("복사 완료 — Claude 대화창에 붙여넣기");
    } catch (error) {
      toast.error(`복사 실패: ${String(error)}`);
    }
  };

  return <Button onClick={handleExport}>{label}</Button>;
};
