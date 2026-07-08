import { useState } from "react";
import { ButtonLongV2 } from "@/components/ui";

// ── 회신 동의 화면 전용 아이콘 ────────────────────────────────────
const ConsentCheckIcon = ({ checked }: { checked: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={checked ? "text-text-brand" : "text-text-placeholder"}
  >
    <path
      d="M2.5 8.5L5.5 11.5L13.5 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConsentChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-text-tertiary"
  >
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ConsentWhiteCheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.5 10.5L7.5 14.5L16.5 5.5"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const REPLY_CONSENT_TERMS = [
  {
    key: "privacy",
    label: "(필수) 개인정보 수집·이용 동의",
    url: "https://tonefit.kr/privacy",
  },
  {
    key: "overseas",
    label: "(필수) 개인정보 국외이전 동의",
    url: "https://tonefit.kr/overseas-transfer",
  },
] as const;

/** 회신 MAIL_READ 약관 동의 화면 */
const ReplyConsentBody = ({
  onAgree,
}: {
  onAgree: () => void;
  onCancel?: () => void;
}) => {
  const [checked, setChecked] = useState({ privacy: false, overseas: false });
  const [isLoading, setIsLoading] = useState(false);

  const allChecked = checked.privacy && checked.overseas;

  const handleToggleAll = () => {
    const next = !allChecked;
    setChecked({ privacy: next, overseas: next });
  };

  const handleToggle = (key: "privacy" | "overseas") => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = async () => {
    if (!allChecked) return;
    setIsLoading(true);
    try {
      await onAgree();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-4 py-2.5 items-center justify-center gap-16">
      {/* 헤드라인 */}
      <h1 className="text-2xl font-bold leading-8 tracking-tight text-text-primary text-center">
        회신 기능 사용을 위해
        <br />
        추가 동의가 필요해요
      </h1>

      {/* 약관 동의 영역 */}
      <div className="flex flex-col gap-6 w-full">
        {/* 전체 동의 버튼 */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="flex items-center justify-center gap-4 h-12 px-6 w-full bg-background-brand rounded-lg hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
        >
          <ConsentWhiteCheckIcon />
          <span className="flex-1 text-center text-lg font-semibold leading-6.5 tracking-tight text-text-inverse">
            약관 전체 동의
          </span>
          <span className="size-5 shrink-0" />
        </button>

        {/* 개별 약관 목록 */}
        <div className="flex flex-col w-full">
          {REPLY_CONSENT_TERMS.map((term) => (
            <div
              key={term.key}
              className="flex items-center gap-2.5 h-11.5 px-5 py-2.5 bg-background-surface"
            >
              <button
                type="button"
                onClick={() => handleToggle(term.key)}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                aria-pressed={checked[term.key]}
              >
                <ConsentCheckIcon checked={checked[term.key]} />
                <span
                  className={`text-sm font-semibold leading-5 tracking-tight whitespace-nowrap ${
                    checked[term.key]
                      ? "text-text-secondary"
                      : "text-text-placeholder"
                  }`}
                >
                  {term.label}
                </span>
              </button>
              <a
                href={term.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
                aria-label={`${term.label} 상세 보기`}
              >
                <ConsentChevronIcon />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full">
        <ButtonLongV2 disabled={!allChecked || isLoading} onClick={handleStart}>
          {isLoading ? "처리 중..." : "시작하기"}
        </ButtonLongV2>
      </div>
    </div>
  );
};

export default ReplyConsentBody;
