import { useState, useCallback } from "react";
import { ButtonLongV2 } from "@/components/ui";
import type {
  CorrectionChange,
  CorrectionLabelType,
  CorrectionsRejectionItem,
} from "@/types";
import type { ReceiverType, PurposeType } from "@/types";
import { devLog } from "@/utils/devLogger";

type DecisionMap = Record<number, "accepted" | "rejected">;

const LABEL_META: Record<
  CorrectionLabelType,
  { text: string; className: string }
> = {
  AUTO: {
    text: "필수",
    className:
      "bg-background-brand-subtle border border-border-focus text-text-brand",
  },
  SUGGEST: {
    text: "권장",
    className:
      "bg-background-surface border border-border-brand text-text-brand-strong",
  },
  STYLE: {
    text: "선택",
    className:
      "bg-background-subtle border border-border-strong text-text-tertiary",
  },
};

const RedoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M10 9.33317L13.3333 5.99984L10 2.6665"
      stroke="#7C4DFF"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.3337 6H6.33366C5.3612 6 4.42857 6.38631 3.74093 7.07394C3.0533 7.76157 2.66699 8.69421 2.66699 9.66667C2.66699 10.1482 2.76183 10.625 2.9461 11.0698C3.13037 11.5147 3.40045 11.9189 3.74093 12.2594C4.42857 12.947 5.3612 13.3333 6.33366 13.3333H8.66699"
      stroke="#7C4DFF"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CorrectionCard = ({
  change,
  index,
  decision,
  onDecide,
  onUndo,
  meaningDamage,
  onToggleMeaningDamage,
}: {
  change: CorrectionChange;
  index: number;
  decision: "accepted" | "rejected" | undefined;
  onDecide: (idx: number, d: "accepted" | "rejected") => void;
  onUndo: (idx: number) => void;
  meaningDamage?: boolean;
  onToggleMeaningDamage?: (idx: number) => void;
}) => {
  const label = LABEL_META[change.label];

  if (decision !== undefined) {
    const previewText =
      decision === "accepted" ? change.corrected : change.original;
    const chipLabel = decision === "accepted" ? "교정" : "원문";
    return (
      <div className="group cursor-pointer hover:bg-background-brand-subtle border border-border-inverse hover:border-border-brand flex gap-3 items-center overflow-hidden p-3 rounded-lg shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] w-full">
        <div className="flex flex-1 gap-2 items-center min-w-0">
          <div className="bg-background-brand flex flex-col items-center justify-center px-2.5 py-0.5 rounded-full shrink-0 w-9">
            <span className="text-xs font-semibold leading-4 text-text-inverse text-center">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="flex flex-1 gap-1.5 items-center min-w-0">
            <span
              className={`flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold leading-4 shrink-0 group-hover:text-text-brand group-hover:bg-background-brand-100  ${decision === "accepted" ? "bg-background-brand-subtle text-text-brand" : "text-text-placeholder bg-background-muted"}`}
            >
              {chipLabel}
            </span>
            <p className="flex-1 text-xs font-semibold leading-4 text-text-primary truncate min-w-0">
              {previewText}
            </p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 shrink-0">
          {decision === "rejected" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMeaningDamage?.(change.index);
              }}
              className={`cursor-pointer shrink-0 transition-opacity ${meaningDamage ? "opacity-100" : ""}`}
              aria-label="의미훼손 의심 표시"
              title="의미훼손 의심"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill={meaningDamage ? "rgba(124,77,255,0.15)" : "none"}
              >
                <path
                  d="M14.4866 12L9.15329 2.66665C9.037 2.46146 8.86836 2.29078 8.66457 2.17203C8.46078 2.05329 8.22915 1.99072 7.99329 1.99072C7.75743 1.99072 7.52579 2.05329 7.322 2.17203C7.11822 2.29078 6.94958 2.46146 6.83329 2.66665L1.49995 12C1.38241 12.2036 1.32077 12.4346 1.32129 12.6697C1.32181 12.9047 1.38447 13.1355 1.50292 13.3385C1.62136 13.5416 1.79138 13.7097 1.99575 13.8259C2.20011 13.942 2.43156 14.0021 2.66662 14H13.3333C13.5672 13.9997 13.797 13.938 13.9995 13.8208C14.202 13.7037 14.3701 13.5354 14.487 13.3327C14.6038 13.1301 14.6653 12.9002 14.6653 12.6663C14.6652 12.4324 14.6036 12.2026 14.4866 12Z"
                  stroke="#7C4DFF"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6V8.66667"
                  stroke="#7C4DFF"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 11.3335H8.00667"
                  stroke="#7C4DFF"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => onUndo(change.index)}
            className="text-text-tertiary hover:text-text-brand cursor-pointer shrink-0"
            aria-label="되돌리기"
          >
            <RedoIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-surface flex flex-col gap-4 items-start overflow-hidden p-3 rounded-lg shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] w-full">
      {/* 헤더: 번호 + 라벨 */}
      <div className="flex items-center w-full">
        <div className="flex flex-1 gap-1 items-center min-w-0">
          <div className="bg-background-brand flex flex-col items-center justify-center px-2.5 py-0.5 rounded-full shrink-0 w-9">
            <span className="text-xs font-semibold leading-4 text-text-inverse w-full text-center">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <span
            className={`flex items-center justify-center h-5 px-2 py-0.5 rounded-full text-xs font-semibold leading-4 shrink-0 ${label.className}`}
          >
            {label.text}
          </span>
        </div>
      </div>

      {/* 원문 → 교정안 델타 */}
      <div className="bg-background-subtle border border-border-subtle flex flex-col gap-3 items-start justify-center p-3.5 rounded-xl w-full">
        <div className="flex flex-col gap-1 w-full">
          <p className="text-xs font-semibold leading-4 text-text-tertiary">
            원문
          </p>
          <p className="text-xs font-normal leading-4.5 text-text-tertiary">
            {change.original}
          </p>
        </div>
        <div className="w-full h-px bg-border-subtle" />
        <div className="flex flex-col gap-1 w-full">
          <p className="text-xs font-semibold leading-4 text-text-tertiary">
            교정안
          </p>
          <p className="text-sm font-semibold leading-5 text-text-primary">
            {change.corrected}
          </p>
        </div>
      </div>

      {/* 이유 */}
      <div className="flex gap-2 items-start py-0.5 w-full">
        <span className="bg-background-muted flex items-center justify-center px-2 py-1 rounded-md shrink-0 text-xs font-semibold leading-4 text-text-secondary">
          이유
        </span>
        <p className="flex-1 text-xs font-normal leading-4.5 text-text-secondary min-w-0">
          {change.reason}
        </p>
      </div>

      {/* 거절 / 수락 버튼 */}
      <div className="flex gap-2 items-end justify-center w-full">
        <button
          type="button"
          onClick={() => onDecide(change.index, "rejected")}
          className="flex flex-1 items-center justify-center px-4 py-1.5 rounded-lg border border-border-default bg-background-surface text-text-secondary text-xs font-semibold leading-4 transition-colors"
        >
          거절
        </button>
        <button
          type="button"
          onClick={() => onDecide(change.index, "accepted")}
          className="flex flex-1 items-center justify-center px-4 py-1.5 rounded-lg border border-background-brand bg-background-brand text-text-inverse text-xs font-semibold leading-4 transition-colors"
        >
          수락
        </button>
      </div>
    </div>
  );
};

const CorrectReviewBody = ({
  changes,
  originalEmail,
  receiver,
  purpose,
  onComplete,
}: {
  changes: CorrectionChange[];
  originalEmail: string;
  receiver: ReceiverType;
  purpose: PurposeType;
  onComplete: (
    finalContent: string,
    acceptedChanges: CorrectionChange[],
    rejectedItems: CorrectionsRejectionItem[],
  ) => void;
}) => {
  const [decisions, setDecisions] = useState<DecisionMap>({});
  // 의미훼손 의심 플래그 — 거절된 항목의 index set
  const [meaningDamageSet, setMeaningDamageSet] = useState<Set<number>>(
    new Set(),
  );

  const decide = useCallback((idx: number, d: "accepted" | "rejected") => {
    setDecisions((prev) => ({ ...prev, [idx]: d }));
  }, []);

  const undo = useCallback((idx: number) => {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
    setMeaningDamageSet((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  }, []);

  const toggleMeaningDamage = useCallback((idx: number) => {
    setMeaningDamageSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const acceptAll = useCallback(() => {
    setDecisions((prev) => {
      const next = { ...prev };
      changes.forEach((c) => {
        if (!next[c.index]) next[c.index] = "accepted";
      });
      return next;
    });
  }, [changes]);

  const acceptedCount = Object.values(decisions).filter(
    (d) => d === "accepted",
  ).length;
  const rejectedCount = Object.values(decisions).filter(
    (d) => d === "rejected",
  ).length;
  const pendingCount = changes.length - acceptedCount - rejectedCount;
  const reviewedCount = acceptedCount + rejectedCount;
  const progress =
    changes.length > 0 ? (reviewedCount / changes.length) * 100 : 0;

  const handleComplete = useCallback(() => {
    // 수락 항목만 start 기준 역순으로 적용 (오프셋 밀림 방지)
    const accepted = changes
      .filter((c) => decisions[c.index] !== "rejected")
      .sort((a, b) => b.start - a.start);

    devLog("[ToneFit DEBUG] originalEmail:", JSON.stringify(originalEmail));
    devLog(
      "[ToneFit DEBUG] originalEmail 줄바꿈 수:",
      (originalEmail.match(/\n/g) ?? []).length,
    );
    accepted.forEach((c) => {
      devLog(
        `[ToneFit DEBUG] 수락 항목 [${c.index}] start=${c.start} end=${c.end}`,
      );
      devLog(`  original: ${JSON.stringify(c.original)}`);
      devLog(`  corrected: ${JSON.stringify(c.corrected)}`);
    });

    let result = originalEmail;
    for (const c of accepted) {
      const corrected = c.corrected.replace(/\\n/g, "\n");
      result = result.slice(0, c.start) + corrected + result.slice(c.end);
    }

    devLog("[ToneFit DEBUG] finalContent:", JSON.stringify(result));
    devLog(
      "[ToneFit DEBUG] finalContent 줄바꿈 수:",
      (result.match(/\n/g) ?? []).length,
    );

    const rejectedItems: CorrectionsRejectionItem[] = changes
      .filter((c) => decisions[c.index] === "rejected")
      .map((c) => ({
        label: c.label,
        original_phrase: c.original,
        corrected_phrase: c.corrected,
        meaning_damage_suspected: meaningDamageSet.has(c.index) ? true : null,
      }));

    // receiver/purpose는 부모가 이미 알고 있으므로 onComplete에서 처리
    void receiver;
    void purpose;

    const acceptedChanges = changes.filter(
      (c) => decisions[c.index] !== "rejected",
    );
    onComplete(result, acceptedChanges, rejectedItems);
  }, [
    changes,
    decisions,
    meaningDamageSet,
    originalEmail,
    onComplete,
    receiver,
    purpose,
  ]);

  return (
    <div className="flex flex-col h-full relative bg-background-page">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5 px-4 pt-3 shrink-0">
        {/* 진행 바 */}
        <div className="bg-background-brand-subtle h-3 rounded-sm w-full overflow-hidden">
          <div
            className="bg-background-brand h-3 rounded-sm transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* 타이틀 + 카운터 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5 items-center py-2.5">
            <span className="text-lg font-semibold leading-6.5 tracking-tight text-text-primary">
              교정 내역
            </span>
            <span className="text-lg font-semibold leading-6.5 tracking-tight text-text-brand">
              {changes.length}건
            </span>
          </div>
          <div className="flex items-center justify-between h-9">
            <div className="flex gap-4 items-center">
              <span className="text-sm font-semibold leading-5 tracking-tight text-text-placeholder">
                수락 {acceptedCount}
              </span>
              <span className="text-sm font-semibold leading-5 tracking-tight text-text-placeholder">
                거절 {rejectedCount}
              </span>
              <span className="text-sm font-semibold leading-5 tracking-tight text-text-placeholder">
                미검토 {pendingCount}
              </span>
            </div>
            <button
              type="button"
              onClick={acceptAll}
              className="bg-background-brand flex items-center justify-center px-2 py-2 rounded-md"
            >
              <span className="text-xs font-semibold leading-4 text-text-inverse whitespace-nowrap">
                일괄 수용
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col gap-2.5">
          {changes.map((change, i) => (
            <CorrectionCard
              key={change.index}
              change={change}
              index={i}
              decision={decisions[change.index]}
              onDecide={decide}
              onUndo={undo}
              meaningDamage={meaningDamageSet.has(change.index)}
              onToggleMeaningDamage={toggleMeaningDamage}
            />
          ))}
        </div>
      </div>

      {/* 하단 그라디언트 + 완료 버튼 */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none h-72 bg-gradient-to-b from-transparent to-background-page" />
      <div className="relative z-10 px-4 pb-4 shrink-0">
        <ButtonLongV2 onClick={handleComplete} disabled={pendingCount > 0}>
          완료
        </ButtonLongV2>
      </div>
    </div>
  );
};

export default CorrectReviewBody;
