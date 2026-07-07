import { useEffect, type ReactNode } from "react";
import ButtonCoreV2 from "@/components/ui/ButtonCoreV2";

export interface ConfirmDialogProps {
  title: string;
  description: string;
  /** footer를 직접 렌더링할 때 사용. 지정하면 기본 버튼 영역을 대체합니다. */
  footer?: ReactNode;
  /** footer 미지정 시 사용되는 확인 버튼 레이블 */
  confirmLabel?: string;
  /** footer 미지정 시 사용되는 취소 버튼 레이블 */
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const ConfirmDialog = ({
  title,
  description,
  footer,
  confirmLabel,
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-background-overlay"
    tabIndex={-1}
    onKeyDown={(e) => { if (e.key === "Escape") onCancel?.(); }}
    ref={(el) => el?.focus()}
  >
    <div className="bg-background-surface rounded-3xl p-2.5 w-full max-w-sm mx-auto flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col gap-3.5 text-center pt-4.75">
        <p className="text-2xl font-bold text-text-primary leading-8 tracking-tight whitespace-pre-line">
          {title}
        </p>
        <p className="text-base text-text-tertiary tracking-tight leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
      {footer ?? (
        <div className="flex gap-3">
          <ButtonCoreV2
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
            size="sm"
          >
            {cancelLabel}
          </ButtonCoreV2>
          <ButtonCoreV2
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
            size="sm"
          >
            {confirmLabel}
          </ButtonCoreV2>
        </div>
      )}
    </div>
  </div>
  );
};

export default ConfirmDialog;
