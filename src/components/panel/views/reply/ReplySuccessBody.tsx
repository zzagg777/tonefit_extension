import { useCallback } from "react";
import { ButtonLongV2, Icon } from "@/components/ui";
import { MailPackingIcon } from "@/components/ui/MotionIcons";

/** 회신 완료 화면 */
const ReplySuccessBody = ({
  onCorrect,
  onReset,
  draftText = "",
  showToast,
}: {
  onCorrect: () => void;
  onReset: () => void;
  draftText?: string;
  showToast?: (message: string) => void;
}) => {
  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(draftText)
      .then(() => {
        showToast?.("복사했어요. 작성창에 붙여넣으면 돼요.");
      })
      .catch(() => {});
  }, [draftText, showToast]);

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full gap-5 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center py-12 min-h-0 gap-5">
        <MailPackingIcon size={88} />
        <div className="flex flex-col gap-3.5 items-center text-center shrink-0">
          <p className="text-xl-plus font-semibold leading-7.5 tracking-tight text-text-primary">
            초안이 준비됐어요
          </p>
          <p className="text-base font-normal leading-6 tracking-tight text-text-secondary text-center">
            Gmail 작성창에 담아뒀어요.
          </p>
        </div>
        <div className="w-full bg-background-surface rounded-2xl p-3.5 shadow-[0px_1px_4px_rgba(124,77,255,0.1)] flex flex-col gap-2.5 h-62.5">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M5.29338 0.227108C5.05537 0.0786829 4.7805 0 4.5 0C4.18699 -0.00018784 3.88177 0.0975907 3.62714 0.279626C3.3725 0.46166 3.18122 0.718823 3.08012 1.01505L2.55535 2.55488L1.01703 3.07965L0.840106 3.15162C0.573463 3.28215 0.351574 3.4889 0.202558 3.74568C0.0535424 4.00245 -0.0158909 4.29768 0.00305782 4.59395C0.0220065 4.89023 0.128483 5.17421 0.308996 5.4099C0.489508 5.6456 0.735929 5.8224 1.01703 5.9179L2.55685 6.44267L3.08162 7.981L3.15359 8.15642C3.28399 8.4231 3.49062 8.64508 3.7473 8.79421C4.00398 8.94334 4.29916 9.01292 4.59542 8.99414C4.89168 8.97535 5.1757 8.86904 5.41149 8.68868C5.64727 8.50831 5.82421 8.26202 5.91988 7.981L6.44465 6.44117L7.98297 5.9164L8.15989 5.84444C8.42654 5.7139 8.64843 5.50715 8.79744 5.25038C8.94646 4.99361 9.01589 4.69837 8.99694 4.4021C8.97799 4.10583 8.87152 3.82185 8.691 3.58615C8.51049 3.35045 8.26407 3.17365 7.98297 3.07815L6.44315 2.55338L5.91838 1.01505L5.84641 0.839632C5.72299 0.587746 5.53139 0.375532 5.29338 0.227108Z" fill="#7C4DFF" />
                </svg>
              </span>
              <p className="text-xs text-text-secondary tracking-tight leading-4">
                작성창에 안 담겼다면 여기서 복사하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 size-4.5 flex items-center justify-center cursor-pointer"
              aria-label="복사"
            >
              <Icon name="copy" size={18} color="var(--color-border-strong)" />
            </button>
          </div>
          <div className="h-px bg-border-default shrink-0" />
          <div className="overflow-y-auto min-h-0 my-2.5 mr-1.25 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-background-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <p className="text-xs text-text-secondary tracking-tight leading-4.5 whitespace-pre-wrap px-1.5 py-1">
              {draftText}
            </p>
          </div>
        </div>
      </div>
      <div className="!hidden w-full shrink-0 flex flex-col gap-2.5">
        <ButtonLongV2 onClick={onCorrect}>이 회신 교정하기</ButtonLongV2>
        <ButtonLongV2 variant="secondary" onClick={onReset}>
          새 회신 시작하기
        </ButtonLongV2>
      </div>
    </div>
  );
};

export default ReplySuccessBody;
