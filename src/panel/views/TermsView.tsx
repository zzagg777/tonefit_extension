/**
 * TermsView — 약관 동의 화면
 *
 * Figma: node 3629-24323 (동의 전) / 3663-23972 (동의 후)
 *
 * 상태:
 * - 각 약관 항목 개별 토글
 * - "약관 전체 동의" 버튼: 전체 on/off 마스터 토글
 * - 필수 3개 모두 동의 시 CTA 활성화
 */

import { useState } from 'react';
import { ButtonLongV2 } from '@/components/ui';
import type { TermsType } from '@/types';

// ── 약관 항목 정의 ──────────────────────────────────────────────

interface TermItem {
  key: TermsType;
  label: string;
  required: boolean;
  url: string;
}

const TERMS_LIST: TermItem[] = [
  {
    key: 'SERVICE',
    label: '[필수] 서비스 이용약관',
    required: true,
    url: 'https://tonefit.kr/terms',
  },
  {
    key: 'PRIVACY',
    label: '[필수] 개인정보처리방침',
    required: true,
    url: 'https://tonefit.kr/privacy',
  },
  {
    key: 'ANALYTICS',
    label: '[필수] 행태 정보 수집 이용 고지',
    required: true,
    url: 'https://tonefit.kr/behavioral-data',
  },
  {
    key: 'MARKETING',
    label: '(선택) 마케팅 수신 동의',
    required: false,
    url: 'https://tonefit.kr/marketing-consent',
  },
  {
    key: 'AI_LEARNING',
    label: '(선택) AI 학습 활용 동의',
    required: false,
    url: 'https://tonefit.kr/ai-quality-consent',
  },
];

// ── 아이콘 ─────────────────────────────────────────────────────

const CheckIcon = ({ checked }: { checked: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={checked ? 'text-text-brand' : 'text-text-placeholder'}
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

const ChevronRightIcon = () => (
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

const WhiteCheckIcon = () => (
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

// ── 메인 컴포넌트 ──────────────────────────────────────────────

interface TermsViewProps {
  /** 필수 약관 모두 동의 후 ToneFit 시작하기 클릭 */
  onComplete: (agreedKeys: TermsType[]) => void;
  error?: string | null;
}

const TermsView = ({ onComplete, error }: TermsViewProps) => {
  const [agreed, setAgreed] = useState<Record<TermsType, boolean>>({
    SERVICE: false,
    PRIVACY: false,
    ANALYTICS: false,
    MARKETING: false,
    AI_LEARNING: false,
    MAIL_READ: false,
    OVERSEAS_TRANSFER: false,
  });

  const allChecked = TERMS_LIST.every((t) => agreed[t.key]);
  const requiredAllChecked = TERMS_LIST.filter((t) => t.required).every(
    (t) => agreed[t.key]
  );

  /** 전체 동의 토글 */
  const handleToggleAll = () => {
    const next = !allChecked;
    setAgreed({
      SERVICE: next,
      PRIVACY: next,
      ANALYTICS: next,
      MARKETING: next,
      AI_LEARNING: next,
      MAIL_READ: next,
      OVERSEAS_TRANSFER: next,
    });
  };

  /** 개별 항목 토글 */
  const handleToggle = (key: TermsType) => {
    setAgreed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = () => {
    if (!requiredAllChecked) return;
    const agreedKeys = TERMS_LIST.filter((t) => agreed[t.key]).map(
      (t) => t.key
    );
    onComplete(agreedKeys);
  };

  return (
    <div className="flex flex-col h-full px-4 py-2.5 items-center justify-center gap-16">
      {/* 헤드라인 */}
      <div className="flex flex-col gap-3.5 items-center text-center w-full">
        <h1 className="text-2xl font-bold leading-8 tracking-tight text-text-primary">
          시작하기 전에
          <br />
          약관에 동의해주세요
        </h1>
        <p className="text-sm font-normal leading-5.5 tracking-tight text-text-primary w-full">
          아래 항목에 모두 동의하시면 Gmail에서
          <br />
          ToneFit을 바로 사용할 수 있어요.
        </p>
      </div>

      {/* 약관 동의 영역 */}
      <div className="flex flex-col gap-6 w-full">
        {/* 전체 동의 버튼 */}
        <button
          type="button"
          onClick={handleToggleAll}
          className="flex items-center justify-center gap-4 h-12 px-6 w-full bg-action-primary-default rounded-lg text-action-primary-foreground hover:bg-action-primary-hover active:bg-action-primary-pressed transition-colors cursor-pointer"
        >
          <WhiteCheckIcon />
          <span className="flex-1 text-center text-lg font-semibold leading-6.5 tracking-tight text-text-inverse">
            약관 전체 동의
          </span>
          {/* balance spacer */}
          <span className="size-5 shrink-0" />
        </button>

        {/* 개별 약관 목록 */}
        <div className="flex flex-col w-full">
          {TERMS_LIST.map((term) => (
            <div
              key={term.key}
              className="flex items-center gap-2.5 h-11.5 px-5 py-2.5 bg-background-surface"
            >
              {/* 체크 토글 */}
              <button
                type="button"
                onClick={() => handleToggle(term.key)}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                aria-pressed={agreed[term.key]}
              >
                <CheckIcon checked={agreed[term.key]} />
                <span
                  className={`text-sm font-semibold leading-5 tracking-tight whitespace-nowrap ${
                    agreed[term.key]
                      ? 'text-text-secondary'
                      : 'text-text-placeholder'
                  }`}
                >
                  {term.label}
                </span>
              </button>

              {/* 약관 상세 보기 */}
              <a
                href={term.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
                aria-label={`${term.label} 상세 보기`}
              >
                <ChevronRightIcon />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && <p className="text-xs text-text-danger text-center">{error}</p>}

      {/* CTA */}
      <div className="w-full">
        <ButtonLongV2
          disabled={!requiredAllChecked}
          onClick={handleStart}
          className="cursor-pointer"
        >
          ToneFit 시작하기
        </ButtonLongV2>
      </div>
    </div>
  );
};

export default TermsView;
