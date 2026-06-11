import { type PartyDraft } from '@pokedex-agent/pokedex-core';
import { type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { Input } from '@/common/ui/Input';
import { useAuthStore } from '@/features/auth';

import { useDeletePreset } from '../model/useDeletePreset';
import { usePresets } from '../model/usePresets';
import { useSavePreset } from '../model/useSavePreset';
import { useSharePreset } from '../model/useSharePreset';
import { useUnsharePreset } from '../model/useUnsharePreset';

const CAP_BY_TIER = { free: 2, paid: 20 } as const;

type PresetManagerProps = {
  currentParty: PartyDraft;
  onLoad: (party: PartyDraft) => void;
};

export const PresetManager = ({ currentParty, onLoad }: PresetManagerProps) => {
  const user = useAuthStore((state) => state.user);
  const presets = usePresets();
  const save = useSavePreset();
  const remove = useDeletePreset();
  const share = useSharePreset();
  const unshare = useUnsharePreset();

  const copyLink = (token: string) => {
    void navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
    toast.success('공유 링크를 복사했습니다');
  };

  const handleShare = (id: string, shareToken: string | null) => {
    if (shareToken) {
      copyLink(shareToken);
      return;
    }
    share.mutate(id, { onSuccess: (res) => copyLink(res.shareToken) });
  };

  if (!user) {
    return (
      <Card>
        <p className="text-muted-foreground text-sm">
          로그인하면 파티를 계정에 저장할 수 있어요 (무료 2개, 유료 20개).
        </p>
      </Card>
    );
  }

  const cap = CAP_BY_TIER[user.tier];
  const items = presets.data ?? [];
  const atCap = items.length >= cap;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const name = ((new FormData(formEl).get('name') as string | null) ?? '').trim();
    if (!name) {
      toast.error('프리셋 이름을 입력하세요');
      return;
    }
    if (currentParty.length === 0) {
      toast.error('저장할 유효한 포켓몬이 없습니다');
      return;
    }
    save.mutate({ name, party: currentParty }, { onSuccess: () => formEl.reset() });
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-sm font-semibold">저장한 파티</h2>
        <span className="text-muted-foreground text-xs">
          {items.length}/{cap}
        </span>
      </div>

      <form onSubmit={handleSave} className="flex gap-2">
        <Input name="name" placeholder="프리셋 이름" maxLength={50} className="flex-1" disabled={atCap} />
        <Button type="submit" size="sm" disabled={save.isPending || atCap}>
          {save.isPending ? '저장 중...' : '현재 파티 저장'}
        </Button>
      </form>
      {atCap && (
        <p className="text-warning text-xs">
          한도에 도달했습니다{user.tier === 'free' ? ' — 유료로 올리면 20개까지 저장됩니다' : ''}.
        </p>
      )}

      {presets.isLoading ? (
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">저장한 파티가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((preset) => (
            <li
              key={preset.id}
              className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-foreground truncate">{preset.name}</span>
              <span className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => onLoad(preset.party)}>
                  불러오기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(preset.id, preset.shareToken)}
                  disabled={share.isPending}
                >
                  {preset.shareToken ? '링크 복사' : '공유'}
                </Button>
                {preset.shareToken && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unshare.mutate(preset.id)}
                    disabled={unshare.isPending}
                  >
                    공유 취소
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(preset.id)} disabled={remove.isPending}>
                  삭제
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
