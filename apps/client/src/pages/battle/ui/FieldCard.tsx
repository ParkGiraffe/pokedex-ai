import { Card } from '@/common/ui/Card';
import { Checkbox } from '@/common/ui/Checkbox';
import { Field } from '@/common/ui/Field';
import { Select } from '@/common/ui/Select';

import { type BattleField } from '../model/store';

type FieldCardProps = {
  field: BattleField;
  trickRoom: boolean;
  onFieldChange: (patch: Partial<BattleField>) => void;
  onTrickRoomChange: (value: boolean) => void;
};

export const FieldCard = ({ field, trickRoom, onFieldChange, onTrickRoomChange }: FieldCardProps) => (
  <Card className="flex flex-col gap-3">
    <h2 className="text-foreground text-sm font-semibold">필드</h2>
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium">내 진입 위험</span>
        <Checkbox
          checked={field.myStealthRock}
          onCheckedChange={(checked) => onFieldChange({ myStealthRock: checked })}
          label="스텔스록"
        />
        <Checkbox
          checked={field.myStickyWeb}
          onCheckedChange={(checked) => onFieldChange({ myStickyWeb: checked })}
          label="끈적네트"
        />
        <Field label="압정 층수">
          <Select
            value={String(field.mySpikes)}
            onValueChange={(value) => onFieldChange({ mySpikes: Number(value) as 0 | 1 | 2 | 3 })}
            options={[
              { value: '0', label: '없음' },
              { value: '1', label: '1층' },
              { value: '2', label: '2층' },
              { value: '3', label: '3층' },
            ]}
          />
        </Field>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium">상대 스크린</span>
        <Checkbox
          checked={field.opponentLightScreen}
          onCheckedChange={(checked) => onFieldChange({ opponentLightScreen: checked })}
          label="빛의장막 (특수 반감)"
        />
        <Checkbox
          checked={field.opponentReflect}
          onCheckedChange={(checked) => onFieldChange({ opponentReflect: checked })}
          label="리플렉터 (물리 반감)"
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium">선공 판정</span>
        <Checkbox
          checked={field.myTailwind}
          onCheckedChange={(checked) => onFieldChange({ myTailwind: checked })}
          label="내 순풍"
        />
        <Checkbox
          checked={field.opponentTailwind}
          onCheckedChange={(checked) => onFieldChange({ opponentTailwind: checked })}
          label="상대 순풍"
        />
        <Checkbox checked={trickRoom} onCheckedChange={onTrickRoomChange} label="트릭룸" />
      </div>
    </div>
    <p className="text-muted-foreground text-xs">
      스텔스록·압정은 교체 진입 데미지로 교체 평가에, 스크린은 데미지에, 순풍·트릭룸은 선공 판정에 반영된다.
    </p>
  </Card>
);
