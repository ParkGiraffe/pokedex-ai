import { type ReactNode, useEffect } from "react";

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5 shadow-xl",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          >
            닫기
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
};
