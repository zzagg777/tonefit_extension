import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChipV2, ButtonLongV2 } from "@/components/ui";
import type { ReceiverType, PurposeType } from "@/types";
import { RECEIVER_OPTIONS, PURPOSE_OPTIONS, EMAIL_MAX } from "../../constants";
import type { PanelMode } from "../../types";

// =============================================================
// 모드 스위치 (생성하기 / 교정하기)
// =============================================================

const ModeSwitch = ({
  mode,
  onChange,
}: {
  mode: PanelMode;
  onChange: (m: PanelMode) => void;
}) => (
  <div className="bg-background-muted rounded-2xl px-1 py-1 flex gap-1 shrink-0">
    {(["generate", "correct"] as PanelMode[]).map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold leading-5 tracking-tight transition-colors cursor-pointer
          ${mode === m ? "bg-background-surface text-text-brand" : "text-text-placeholder"}`}
      >
        {m === "generate" ? "생성하기" : "교정하기"}
      </button>
    ))}
  </div>
);

// =============================================================
// 교정 첫 안내 배너
// =============================================================

const CorrectionHint = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="bg-background-info-subtle flex gap-3 items-center px-2.5 py-2.5 rounded-2xl shrink-0">
    <div className="flex flex-1 gap-3 items-center min-w-0">
      <svg
        className="shrink-0 size-6 text-icon-info"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1 4a1 1 0 0 1 2 0v5a1 1 0 0 1-2 0v-5z"
          fill="currentColor"
        />
      </svg>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-2xs font-bold leading-3.5 tracking-tight text-text-info">
          작성한 메일을 받는 사람과 목적에 맞게 다듬어드려요.
        </p>
        <p className="text-2xs font-normal leading-3.5 tracking-tight text-text-info">
          수신자 선택 후, 교정하고 싶은 메일 원문을 입력해주세요.
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onDismiss}
      className="shrink-0 size-6 flex items-center justify-center cursor-pointer text-icon-info"
      aria-label="닫기"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
        <path
          d="M18 6L6 18M6 6l12 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>
);

// =============================================================
// 입력 폼 패널 본문
// =============================================================

/** 입력 폼 패널 본문 */
const GenerateInputBody = ({
  panelMode,
  receiver,
  setReceiver,
  purpose,
  setPurpose,
  emailText,
  setEmailText,
  canGenerate,
  onGenerate,
  tooltipSlot,
  onChipSelect,
  showCorrectionHint,
  onDismissCorrectionHint,
  onModeChange,
  mode,
}: {
  panelMode: PanelMode;
  receiver: ReceiverType | null;
  setReceiver: (v: ReceiverType | null) => void;
  purpose: PurposeType | null;
  setPurpose: (v: PurposeType | null) => void;
  emailText: string;
  setEmailText: (v: string) => void;
  canGenerate: boolean;
  onGenerate: () => void;
  tooltipSlot?: ReactNode;
  onChipSelect?: () => void;
  showCorrectionHint: boolean;
  onDismissCorrectionHint: () => void;
  onModeChange: (m: PanelMode) => void;
  mode?: "demo" | "extension";
}) => {
  const labelClass =
    "text-base font-semibold leading-6 tracking-tight text-text-primary";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(32);
  const [hasScroll, setHasScroll] = useState(false);

  const updateThumb = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight > clientHeight;
    setHasScroll(scrollable);
    if (!scrollable) return;
    const trackH = clientHeight - 10; // 상하 5px 여백
    const ratio = clientHeight / scrollHeight;
    const tH = Math.max(Math.round(trackH * ratio), 20);
    const maxTop = trackH - tH;
    const tTop =
      5 + Math.round((scrollTop / (scrollHeight - clientHeight)) * maxTop);
    setThumbHeight(tH);
    setThumbTop(tTop);
  };

  return (
    <div className="flex-1 flex flex-col px-2 py-2 gap-6 justify-between h-full overflow-y-auto">
      <div className="panel__top flex flex-col gap-4">
        {mode !== "demo" && (
          <div className="panel__header flex flex-col gap-4">
            {/* 모드 스위치 */}
            <ModeSwitch mode={panelMode} onChange={onModeChange} />

            {/* 교정 첫 안내 배너 */}
            {panelMode === "correct" && showCorrectionHint && (
              <CorrectionHint onDismiss={onDismissCorrectionHint} />
            )}

            {/* 툴팁 슬롯 (생성 모드 전용) */}
            {panelMode === "generate" && tooltipSlot}
          </div>
        )}

        <div className="flex flex-col gap-6 p-2">
          {/* 수신자 유형 */}
          <div className="flex flex-col gap-4">
            <p className={labelClass}>수신자 유형 선택</p>
            <div className="grid grid-cols-2 gap-1">
              {RECEIVER_OPTIONS.map(({ value, label }) => (
                <ChipV2
                  key={value}
                  selected={receiver === value}
                  size="md"
                  onClick={() => {
                    setReceiver(receiver === value ? null : value);
                    onChipSelect?.();
                    onDismissCorrectionHint();
                  }}
                >
                  {label}
                </ChipV2>
              ))}
            </div>
          </div>

          {/* 목적 — 생성 모드만 표시 */}
          {panelMode === "generate" && (
            <div className="flex flex-col gap-4 py-4">
              <p className={labelClass}>목적 선택</p>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSE_OPTIONS.map(({ value, label }) => (
                  <ChipV2
                    key={value}
                    selected={purpose === value}
                    size="md"
                    onClick={() => {
                      setPurpose(purpose === value ? null : value);
                      onChipSelect?.();
                      onDismissCorrectionHint();
                    }}
                  >
                    {label}
                  </ChipV2>
                ))}
              </div>
            </div>
          )}

          {/* 이메일 내용 입력 — 생성 모드만 */}
          {panelMode === "generate" && (
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex gap-3.25 items-center">
                <p className={labelClass}>메일 상황 입력</p>
                <span className="text-xs leading-4 text-text-placeholder">
                  *최소 10자 이상 입력해 주세요.
                </span>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <div
                  className={`relative bg-background-surface border rounded-xl p-2.5 flex-1 min-h-[218px] ${
                    emailText.length > EMAIL_MAX
                      ? "border-border-danger"
                      : emailText.length >= 10
                        ? "border-border-brand"
                        : "border-border-default"
                  }`}
                >
                  <textarea
                    ref={textareaRef}
                    data-panel-input="email-brief"
                    className="w-full h-full resize-none text-sm font-normal leading-5.5 tracking-tight text-text-secondary placeholder:text-text-placeholder bg-transparent outline-none [&::-webkit-scrollbar]:hidden"
                    placeholder="ex: 김ㅇㅇ 팀장님에게 하반기 실적 보고서를 전달하고 싶어요."
                    value={emailText}
                    onChange={(e) => {
                      setEmailText(e.target.value);
                      requestAnimationFrame(updateThumb);
                    }}
                    onScroll={updateThumb}
                    onFocus={updateThumb}
                    rows={5}
                  />
                  {/* 커스텀 스크롤바 — 기본 스크롤바 대체 */}
                  <div className="absolute right-1 top-0 bottom-0 w-1 flex flex-col pointer-events-none">
                    {hasScroll && (
                      <div
                        className="absolute w-1 bg-background-muted rounded-full"
                        style={{ top: thumbTop, height: thumbHeight }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <span
                    className={`text-xs font-normal leading-4.5 tracking-tight ${
                      emailText.length > EMAIL_MAX
                        ? "text-text-danger"
                        : emailText.length >= 10
                          ? "text-text-brand"
                          : "text-text-placeholder"
                    }`}
                  >
                    {emailText.length} / {EMAIL_MAX}자
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA 버튼 */}
      <div className="shrink-0 flex flex-col gap-2 p-2">
        <ButtonLongV2 disabled={!canGenerate} onClick={onGenerate}>
          {panelMode === "correct" ? "교정 시작하기" : "초안 생성하기"}
        </ButtonLongV2>
        {panelMode === "generate" && (
          <p className="flex gap-1 items-center justify-center text-text-placeholder text-xs leading-4.5 tracking-tight">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M6.99984 12.8333C10.2215 12.8333 12.8332 10.2216 12.8332 6.99996C12.8332 3.7783 10.2215 1.16663 6.99984 1.16663C3.77818 1.16663 1.1665 3.7783 1.1665 6.99996C1.1665 10.2216 3.77818 12.8333 6.99984 12.8333Z"
                  stroke="#9AA1B2"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 9.33333V7"
                  stroke="#9AA1B2"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 4.66663H7.00583"
                  stroke="#9AA1B2"
                  strokeWidth="1.16667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              초안은 Gmail 작성칸에 채워지고, 보내기 전 수정할 수 있어요.
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default GenerateInputBody;
