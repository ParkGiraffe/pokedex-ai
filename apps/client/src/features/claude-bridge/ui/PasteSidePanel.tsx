import { parseClaudeResponse } from "@pokedex-agent/pokedex-core";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/common/ui/Button";
import { Sheet } from "@/common/ui/Sheet";

import { useClaudeBridgeStore } from "../model/store";
import { AppliedResult } from "./AppliedResult";

type PasteSidePanelProps = {
  open: boolean;
  onClose: () => void;
};

export const PasteSidePanel = ({ open, onClose }: PasteSidePanelProps) => {
  const [raw, setRaw] = useState("");
  const lastResult = useClaudeBridgeStore((state) => state.lastResult);
  const setResult = useClaudeBridgeStore((state) => state.setResult);

  const handleApply = () => {
    const result = parseClaudeResponse(raw);
    if (!result.success) {
      toast.error(`반영 실패: ${result.reason}`);
      return;
    }
    setResult(result.data);
    toast.success("분석 결과를 반영했다");
  };

  return (
    <Sheet open={open} title="Claude 답변 붙여넣기" onClose={onClose}>
      <textarea
        value={raw}
        onChange={(event) => setRaw(event.currentTarget.value)}
        placeholder="Claude 답변 전체를 붙여넣어라 (JSON 코드블록 포함)"
        className="h-48 w-full resize-y rounded-md border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
      />
      <Button onClick={handleApply}>분석 결과 반영</Button>
      {lastResult && <AppliedResult result={lastResult} />}
    </Sheet>
  );
};
