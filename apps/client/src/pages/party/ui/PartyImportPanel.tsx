import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/common/ui/Button';
import { Sheet } from '@/common/ui/Sheet';
import { useImportParty } from '@/features/advisor/model/useImportParty';

import { downscaleImage } from '../lib/image';
import { parsePartyImport } from '../lib/import';
import { usePartyStore } from '../model/store';

type PartyImportPanelProps = {
  open: boolean;
  onClose: () => void;
};

export const PartyImportPanel = ({ open, onClose }: PartyImportPanelProps) => {
  const setMembers = usePartyStore((state) => state.setMembers);
  const importParty = useImportParty();
  const [files, setFiles] = useState<File[]>([]);
  const [raw, setRaw] = useState('');
  const warnings = importParty.data?.warnings ?? [];

  const handleAddFiles = (selected: FileList | null) => {
    if (!selected || selected.length === 0) {
      return;
    }
    setFiles((previous) => [...previous, ...Array.from(selected)]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((previous) => previous.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      toast.error('이미지를 먼저 추가');
      return;
    }
    let images: string[];
    try {
      images = await Promise.all(files.map((file) => downscaleImage(file)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '이미지 처리 실패');
      return;
    }
    importParty.mutate(images, {
      onSuccess: (result) => {
        setRaw(JSON.stringify(result.party, null, 1));
        if (result.warnings.length > 0) {
          toast.warning(`분석 완료 — 확인 필요 ${result.warnings.length}건`);
        } else {
          toast.success('분석 완료 — 검토 후 등록');
        }
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : '분석 실패'),
    });
  };

  const handleRegister = () => {
    try {
      const members = parsePartyImport(raw);
      if (members.length === 0) {
        toast.error('등록할 포켓몬 없음');
        return;
      }
      setMembers(members);
      toast.success(`${members.length}마리 등록 완료`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '가져오기 실패');
    }
  };

  return (
    <Sheet open={open} title="파티 가져오기" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <label className="text-foreground text-sm font-medium">파티 화면 이미지로 분석</label>
        <p className="text-muted-foreground text-xs">
          능력(기술) 화면과 스테이터스(EV) 화면을 모두 추가한 뒤 분석하면 기술·EV가 합쳐진다.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={importParty.isPending}
          onChange={(event) => {
            handleAddFiles(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
          className="text-foreground file:bg-accent file:text-accent-foreground hover:file:bg-accent/80 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5"
        />

        {files.length > 0 && (
          <ul className="flex flex-col gap-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="bg-card text-foreground flex items-center justify-between rounded px-2 py-1 text-xs"
              >
                <span>
                  {index + 1}. {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button variant="secondary" onClick={handleAnalyze} disabled={files.length === 0 || importParty.isPending}>
          {importParty.isPending ? '분석 중...' : `이미지 ${files.length}장 분석`}
        </Button>
        {importParty.isError && (
          <p className="text-destructive text-xs">
            {importParty.error instanceof Error ? importParty.error.message : '분석 실패'}
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-xs">분석 결과(또는 직접 붙여넣은 JSON)를 검토 후 등록</p>
      <textarea
        value={raw}
        onChange={(event) => setRaw(event.currentTarget.value)}
        placeholder='[{"species":"한카리아스","ability":"까칠한피부", ...}]'
        className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-ring h-48 w-full resize-y rounded-md border p-3 font-mono text-xs focus:outline-none"
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

      <Button onClick={handleRegister}>파티 등록</Button>
    </Sheet>
  );
};
