import { toast } from "sonner";

import { Button } from "@/common/ui/Button";

type CopyButtonProps = {
  buildText: () => string;
  label?: string;
  disabled?: boolean;
};

export const CopyButton = ({ buildText, label = "Claude에 분석 요청", disabled }: CopyButtonProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      toast.success("복사 완료 — Claude 대화창에 붙여넣기");
    } catch (error) {
      toast.error(`복사 실패: ${String(error)}`);
    }
  };

  return (
    <Button variant="secondary" onClick={handleCopy} disabled={disabled}>
      {label}
    </Button>
  );
};
