import { type ChangeEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { Input } from '@/common/ui/Input';
import { useAuthStore } from '@/features/auth';
import { useBattleVision } from '@/features/battle-vision/model/useBattleVision';

export const ScreenshotTab = () => {
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const advise = useBattleVision();
  const [image, setImage] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => toast.error('이미지를 읽지 못했습니다');
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!image) {
      toast.error('배틀 스크린샷을 올려주세요');
      return;
    }
    advise.mutate({ image, note: note.trim() || undefined });
  };

  if (!isLoggedIn) {
    return (
      <Card>
        <p className="text-muted-foreground text-sm">
          로그인하면 배틀 스크린샷을 올려 다음 한 수를 조언받을 수 있어요.
        </p>
      </Card>
    );
  }

  const advice = advise.data;

  return (
    <section className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <label className="border-border hover:bg-accent flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-sm">
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {image ? (
            <img src={image} alt="배틀 스크린샷" className="max-h-64 rounded object-contain" />
          ) : (
            <span className="text-muted-foreground">배틀 스크린샷 선택 (클릭)</span>
          )}
        </label>
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="메모 (선택): 내 파티·고민 등"
          maxLength={200}
        />
        <Button onClick={handleSubmit} disabled={advise.isPending || !image} className="self-start">
          {advise.isPending ? '분석 중...' : '조언 받기'}
        </Button>
      </Card>

      {advice && (
        <Card className="flex flex-col gap-3">
          {!advice.readable && (
            <p className="text-warning text-sm">
              화면을 충분히 읽지 못했습니다. 배틀 화면이 또렷하게 나온 스크린샷을 올려주세요.
            </p>
          )}
          <div>
            <p className="text-muted-foreground text-xs">상황</p>
            <p className="text-foreground text-sm">{advice.situation}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">추천</p>
            <p className="text-primary text-lg font-bold">{advice.recommendation}</p>
          </div>
          {advice.options.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">선택지</p>
              <ul className="flex flex-col gap-1 text-sm">
                {advice.options.map((option, index) => (
                  <li key={index} className="text-foreground">
                    <span className="font-medium">{option.action}</span>
                    <span className="text-muted-foreground"> · {option.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {advice.cautions.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">주의</p>
              <ul className="flex flex-col gap-0.5 text-sm">
                {advice.cautions.map((caution, index) => (
                  <li key={index} className="text-foreground">
                    {caution}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </section>
  );
};
