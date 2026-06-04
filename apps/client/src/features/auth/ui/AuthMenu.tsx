import { useState } from "react";

import { Button } from "@/common/ui/Button";
import { QuotaBadge } from "@/features/quota";

import { useAuthStore } from "../model/store";
import { AuthSheet } from "./AuthSheet";

export const AuthMenu = () => {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [open, setOpen] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{user.nickname ?? user.email}</span>
        <QuotaBadge />
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
          {user.tier}
        </span>
        <Button variant="ghost" size="sm" onClick={clear}>
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        로그인
      </Button>
      <AuthSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
};
