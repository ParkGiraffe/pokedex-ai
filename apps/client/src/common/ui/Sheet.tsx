import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/common/lib/cn";

type SheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
};

export const Sheet = ({ open, title, onClose, className, children }: SheetProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  // body로 포털한다. 헤더의 backdrop-blur 같은 ancestor가 containing block을 만들면
  // fixed가 viewport가 아니라 그 박스에 갇히므로(로그인 드로어가 헤더 안에서 납작해지던 버그).
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-border bg-popover p-5 shadow-xl",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            닫기
          </button>
        </div>
        {children}
      </aside>
    </div>,
    document.body
  );
};
