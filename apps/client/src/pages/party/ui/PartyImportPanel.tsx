import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/common/ui/Button";
import { Sheet } from "@/common/ui/Sheet";
import { useImportParty } from "@/features/advisor/model/useImportParty";

import { parsePartyImport } from "../lib/import";
import { usePartyStore } from "../model/store";

type PartyImportPanelProps = {
  open: boolean;
  onClose: () => void;
};

export const PartyImportPanel = ({ open, onClose }: PartyImportPanelProps) => {
  const setMembers = usePartyStore((state) => state.setMembers);
  const [raw, setRaw] = useState("");
  const importParty = useImportParty();
  const warnings = importParty.data?.warnings ?? [];

  const handleSelectImage = (file?: File) => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      importParty.mutate(String(reader.result ?? ""), {
        onSuccess: (result) => {
          setRaw(JSON.stringify(result.party, null, 1));
          if (result.warnings.length > 0) {
            toast.warning(`분석 완료 — 확인 필요 ${result.warnings.length}건`);
          } else {
            toast.success("분석 완료 — 검토 후 등록하라");
          }
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "분석 실패"),
      });
    };
    reader.readAsDataURL(file);
  };

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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-300">파티 화면 이미지로 분석 (로컬 비전)</label>
        <input
          type="file"
          accept="image/*"
          disabled={importParty.isPending}
          onChange={(event) => handleSelectImage(event.currentTarget.files?.[0])}
          className="text-sm text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-neutral-100 hover:file:bg-neutral-700"
        />
        {importParty.isPending && <p className="text-xs text-emerald-400">분석 중... (로컬 모델)</p>}
        {importParty.isError && (
          <p className="text-xs text-rose-400">
            {importParty.error instanceof Error ? importParty.error.message : "분석 실패"}
          </p>
        )}
      </div>

      <p className="text-xs text-neutral-500">또는 파티 JSON을 직접 붙여넣어도 된다.</p>
      <textarea
        value={raw}
        onChange={(event) => setRaw(event.currentTarget.value)}
        placeholder='[{"species":"한카리아스","ability":"까칠한피부", ...}]'
        className="h-56 w-full resize-y rounded-md border border-neutral-700 bg-neutral-900 p-3 font-mono text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
      />

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-800 bg-amber-950 p-2">
          <p className="mb-1 text-xs font-medium text-amber-300">확인 필요 (등록은 됨)</p>
          <ul className="flex flex-col gap-0.5 text-xs text-amber-200">
            {warnings.map((warning) => (
              <li key={warning}>· {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={handleImport}>파티 등록</Button>
    </Sheet>
  );
};
