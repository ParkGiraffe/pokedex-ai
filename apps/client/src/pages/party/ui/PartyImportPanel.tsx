import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/common/ui/Button";
import { Sheet } from "@/common/ui/Sheet";

import { parsePartyImport } from "../lib/import";
import { usePartyStore } from "../model/store";

type PartyImportPanelProps = {
  open: boolean;
  onClose: () => void;
};

export const PartyImportPanel = ({ open, onClose }: PartyImportPanelProps) => {
  const setMembers = usePartyStore((state) => state.setMembers);
  const [raw, setRaw] = useState("");

  const handleImport = () => {
    try {
      const members = parsePartyImport(raw);
      if (members.length === 0) {
        toast.error("등록할 포켓몬이 없다");
        return;
      }
      setMembers(members);
      toast.success(`${members.length}마리 등록 완료`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "가져오기 실패");
    }
  };

  return (
    <Sheet open={open} title="파티 가져오기" onClose={onClose}>
      <p className="text-sm text-neutral-400">파티 JSON을 붙여넣으면 6슬롯을 한 번에 채운다.</p>
      <textarea
        value={raw}
        onChange={(event) => setRaw(event.currentTarget.value)}
        placeholder='[{"species":"한카리아스","ability":"까칠한피부", ...}]'
        className="h-64 w-full resize-y rounded-md border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
      />
      <Button onClick={handleImport}>파티 등록</Button>
    </Sheet>
  );
};
