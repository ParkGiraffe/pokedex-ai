import { type FormEvent, useState } from 'react';

import { cn } from '@/common/lib/cn';
import { Button } from '@/common/ui/Button';
import { Field } from '@/common/ui/Field';
import { Input } from '@/common/ui/Input';
import { Sheet } from '@/common/ui/Sheet';

import { useLogin } from '../model/useLogin';
import { useRegister } from '../model/useRegister';

type AuthSheetProps = {
  open: boolean;
  onClose: () => void;
};

type Mode = 'login' | 'signup';

export const AuthSheet = ({ open, onClose }: AuthSheetProps) => {
  const [mode, setMode] = useState<Mode>('login');
  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const nickname = String(form.get('nickname') ?? '').trim() || undefined;
    const onSuccess = () => onClose();
    if (mode === 'login') {
      login.mutate({ email, password }, { onSuccess });
    } else {
      register.mutate({ email, password, nickname }, { onSuccess });
    }
  };

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={cn(
        'flex-1 rounded px-3 py-1.5 transition',
        mode === value ? 'bg-card text-foreground font-semibold' : 'text-muted-foreground',
      )}
    >
      {label}
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title={mode === 'login' ? '로그인' : '회원가입'}>
      <div className="bg-muted flex gap-1 rounded-md p-1 text-sm">
        {tab('login', '로그인')}
        {tab('signup', '회원가입')}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="이메일">
          <Input name="email" type="email" required autoComplete="email" placeholder="me@example.com" />
        </Field>
        <Field label="비밀번호">
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="8자 이상"
          />
        </Field>
        {mode === 'signup' && (
          <Field label="닉네임 (선택)">
            <Input name="nickname" maxLength={20} placeholder="기린" />
          </Field>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
        </Button>
      </form>
    </Sheet>
  );
};
