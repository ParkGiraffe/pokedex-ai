import { Link } from '@tanstack/react-router';

import { Button } from '@/common/ui/Button';
import { Card } from '@/common/ui/Card';
import { useAuthStore } from '@/features/auth';
import { PartyView } from '@/features/party-view';
import { useCopyPreset } from '@/features/presets/model/useCopyPreset';
import { useSharedPreset } from '@/features/presets/model/useSharedPreset';

type SharedPresetPageProps = {
  token: string;
};

export const SharedPresetPage = ({ token }: SharedPresetPageProps) => {
  const shared = useSharedPreset(token);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const copy = useCopyPreset();

  if (shared.isLoading) {
    return <p className="text-muted-foreground text-sm">불러오는 중...</p>;
  }

  if (shared.isError || !shared.data) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <p className="text-foreground text-sm">공유된 프리셋을 찾을 수 없습니다. 링크가 만료됐거나 잘못됐어요.</p>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">홈으로</Link>
        </Button>
      </Card>
    );
  }

  const { name } = shared.data;

  const handleCopy = () => {
    copy.mutate(token);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs">공유된 파티</p>
          <h1 className="text-foreground text-lg font-semibold">{name}</h1>
        </div>
        {isLoggedIn ? (
          <Button size="sm" onClick={handleCopy} disabled={copy.isPending}>
            {copy.isPending ? '저장 중...' : '내 프리셋으로 복사'}
          </Button>
        ) : (
          <p className="text-muted-foreground text-xs">로그인하면 내 프리셋으로 저장할 수 있어요.</p>
        )}
      </div>
      <PartyView party={shared.data.party} />
    </div>
  );
};
