/**
 * ToneFitPanel
 *
 * 이메일 생성 패널 컴포넌트입니다.
 * DemoPage 및 크롬 익스텐션에서 공통으로 재사용됩니다.
 *
 * 생성 로직(API 호출 / mock)은 부모가 `onRequest` prop으로 주입합니다.
 * 패널 자체는 UI 상태(input → loading → success / error)만 관리합니다.
 *
 * 사용 예시:
 *
 * // 데모 (mock)
 * <ToneFitPanel
 *   remainingCount={3}
 *   onRequest={async () => { await delay(3000); return MOCK_EMAIL; }}
 *   onSuccess={(subject, content) => { ... }}
 *   onReset={() => { ... }}
 * />
 *
 * // 익스텐션 (실제 API)
 * <ToneFitPanel
 *   remainingCount={serverCount}
 *   onRequest={async (params) => await postGeneration(params)}
 *   onSuccess={(subject, content) => { ... }}
 *   onReset={() => { ... }}
 * />
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  startTransition,
} from "react";
import type { ReactNode } from "react";
import { ChipV2, ButtonLongV2, Icon } from "@/components/ui";
import type {
  ReceiverType,
  PurposeType,
  CorrectionChange,
  CorrectionLabelType,
  CorrectionsRejectionItem,
} from "@/types";
import imgPanelIcon from "@/assets/mail-logo.svg";
import {
  MailPackingIcon,
  MailReadingIcon,
  ErrorNoticeIcon,
  LoginExpiredIcon,
  AIPencilWritingIcon,
  NoCorrectionIcon,
} from "@/components/ui/MotionIcons";
import { devLog } from "@/utils/devLogger";

// =============================================================
// 도메인 데이터
// =============================================================

const RECEIVER_OPTIONS: { value: ReceiverType; label: string }[] = [
  { value: "DIRECT_SUPERVISOR", label: "상사" },
  { value: "OTHER_DEPT_COLLEAGUE", label: "동료" },
  { value: "CLIENT", label: "고객사" },
  { value: "EXTERNAL_PARTNER", label: "협력사" },
];

const PURPOSE_OPTIONS: { value: PurposeType; label: string }[] = [
  { value: "REPORT", label: "보고" },
  { value: "REQUEST", label: "요청" },
  { value: "NOTICE", label: "안내" },
  { value: "THANKS", label: "감사" },
  { value: "APOLOGY", label: "사과" },
  { value: "DECLINE", label: "거절" },
];

/** 이메일 내용 입력 최대 글자 수 (생성용 brief — 교정용 2000자와 다름) */
const EMAIL_MAX = 200;

/** [DEV ONLY] 교정 리뷰 화면 미리보기용 mock 데이터 */
const DEV_MOCK_ORIGINAL =
  "팀장님, 보고서 확인해주세요. 문제 있으면 알려주세요.";

const DEV_MOCK_REPLY_ANALYSIS: import("@/types").ReplyAnalysisResponse = {
  conversation:
    "김팀장이 프로젝트 일정 조정 가능 여부를 문의했고, 추가로 예산 확인도 요청했습니다.",
  recipient: {
    type: "DIRECT_SUPERVISOR",
    label: "상사",
    confidence: "high",
    reason: "발신인이 팀장 직함을 사용하고 있습니다.",
  },
  questions: [
    { id: 1, question: "프로젝트 일정 조정이 가능한가요?" },
    { id: 2, question: "예산 변경 사항이 있나요?" },
    { id: 3, question: "추가로 전달해야 할 사항이 있나요?" },
  ],
};

const DEV_MOCK_REPLY_SUMMARIES: string[] = [
  "프로젝트 일정 조정 가능 여부 문의",
  "예산 항목 확인 요청 및 다음 주 회의 일정 조율 제안",
];
const DEV_MOCK_CHANGES: import("@/types").CorrectionChange[] = [
  {
    index: 0,
    start: 8,
    end: 14,
    original: "확인해주세요",
    corrected: "확인 부탁드립니다",
    reason: "구어적인 요청을 업무 메일에 맞는 정중한 표현으로 다듬었습니다.",
    label: "AUTO",
    confidence: 0.95,
    applied_rules: [],
    action: null,
  },
  {
    index: 1,
    start: 17,
    end: 23,
    original: "문제 있으면",
    corrected: "특이사항 있으면",
    reason: "모호한 표현을 협업자가 바로 이해할 수 있게 구체화했습니다.",
    label: "SUGGEST",
    confidence: 0.88,
    applied_rules: [],
    action: null,
  },
  {
    index: 2,
    start: 24,
    end: 29,
    original: "알려주세요",
    corrected: "말씀해 주세요",
    reason: "친근한 느낌은 유지하되 비즈니스 메일 톤에 맞게 정리했습니다.",
    label: "STYLE",
    confidence: 0.75,
    applied_rules: [],
    action: null,
  },
];

// =============================================================
// 유틸
// =============================================================

/**
 * 자음·모음·이모지·공백만으로 이루어진 경우 true
 * 완성된 한글 음절(가-힣), 영문, 숫자, 특수문자가 하나라도 있으면 false
 */
const isOnlyJamoOrSpaces = (text: string): boolean => {
  const withoutHtml = text.replace(/<[^>]*>/g, "");
  const stripped = withoutHtml.replace(/\s/g, "");
  if (!stripped) return true;
  const withoutEmoji = stripped.replace(/\p{Extended_Pictographic}/gu, "");
  if (!withoutEmoji) return true;
  return [...withoutEmoji].every((char) => {
    const code = char.charCodeAt(0);
    return code >= 0x3131 && code <= 0x318e;
  });
};

// =============================================================
// 타입
// =============================================================

export type PanelView =
  | "input"
  | "loading"
  | "success"
  | "error"
  | "correction-review"
  | "no-correction"
  | "reply-loading-analysis"
  | "reply-consent"
  | "reply-input"
  | "reply-loading-write"
  | "reply-success";
export type PanelMode = "generate" | "correct" | "reply";

/** onRequest에 전달되는 생성 파라미터 */
export interface GenerateParams {
  receiver: ReceiverType;
  purpose: PurposeType;
  emailText: string;
  /** 교정 모드 여부 — 익스텐션에서 Gmail 본문을 읽어 교정 API 호출 시 true */
  correctionMode?: boolean;
}

/** onRequest가 반환하는 생성 결과 — 생성 모드와 교정 모드 분기 */
export type GenerateResult =
  | { type: "email"; subject: string; content: string }
  | {
      type: "correction";
      changes: CorrectionChange[];
      originalEmail: string;
      receiver: ReceiverType;
      purpose: PurposeType;
    };

export interface ToneFitPanelProps {
  /**
   * 남은 무료 사용 횟수
   * 데모: localStorage 기반 / 익스텐션: 서버 기반
   */
  remainingCount: number;
  /**
   * 이메일 생성 요청 함수 (부모가 주입)
   * resolve → 성공 (subject, content 반환)
   * reject  → 실패 (error 뷰 표시)
   */
  onRequest: (params: GenerateParams) => Promise<GenerateResult>;
  /**
   * 생성 성공 시 콜백
   * 부모가 Gmail 목업 등 외부 UI에 결과를 반영할 때 사용
   */
  onSuccess: (subject: string, content: string) => void;
  /** 새 이메일 작성 (성공 화면 → 입력 초기화) */
  onReset: () => void;
  /**
   * 잔여 횟수가 0인 상태에서 생성 버튼 클릭 시 호출
   * 부모가 "횟수 소진" 팝업 등 후속 처리를 담당
   */
  onExhausted?: () => void;
  /**
   * 패널 헤더(로고 + 잔여 횟수 뱃지) 표시 여부
   * 데모: true (기본값) / 익스텐션 사이드 패널: false
   */
  showHeader?: boolean;
  /**
   * 사용 모드
   * 'demo': 생성 완료 후 "ToneFit 시작하기" 버튼 (기본값)
   * 'extension': 생성 완료 후 "새 초안 만들기" 버튼
   */
  mode?: "demo" | "extension";
  /** 입력 뷰 상단에 렌더할 슬롯 (툴팁 등 익스텐션 전용 UI) */
  tooltipSlot?: ReactNode;
  /** 수신자/목적 칩 선택 시 콜백 (툴팁 dismiss 등에 활용) */
  onChipSelect?: () => void;
  /** 로딩 중 취소 버튼 표시 여부 (익스텐션 전용) */
  onCancel?: () => void;
  /**
   * onRequest가 reject될 때 호출 — 부모가 에러 종류를 판별해 errorVariant 상태를 업데이트할 때 사용
   * cancelledRef.current === true인 경우(취소)에는 호출되지 않음
   */
  onError?: (err: unknown) => void;
  /**
   * 에러 화면 종류
   * 'generic': 기본 (잠시 후 다시 시도)
   * 'session_expired': 세션 만료 → 로그인 하기 버튼
   * 'rate_limited': 레이트리밋 → 60초 카운트다운 후 다시 시도
   */
  errorVariant?: ErrorVariant;
  /** 세션 만료 에러 화면의 "로그인 하기" 버튼 콜백 */
  onGoToLogin?: () => void;
  /** 교정 완료 시 거절 항목 전송 콜백 (fire-and-forget, 실패해도 UI에 영향 없음) */
  onCorrectionsRejected?: (
    items: CorrectionsRejectionItem[],
    receiver: ReceiverType,
    purpose: PurposeType,
  ) => void;
  /** [DEV ONLY] 패널 뷰 강제 지정. undefined면 내부 상태 사용 */
  devForceView?: PanelView;
  /** [DEV ONLY] 패널 모드 강제 지정 (error/loading 메시지 미리보기용) */
  devPanelMode?: PanelMode;
  /** 패널 초기 모드 — Gmail 본문 유무 등 외부 조건으로 결정 시 사용 */
  initialPanelMode?: PanelMode;
  /** 툴바 버튼 재클릭 시 동적 모드 갱신 — input 뷰에서만 반영 */
  requestedPanelMode?: PanelMode;
  /**
   * 교정 모드에서 setView('loading') 전에 실행되는 사전 검증 콜백
   * throw하면 로딩 전환 없이 중단 — 토스트 메시지를 직접 throw와 함께 전달
   */
  onPreCheck?: () => Promise<void>;
  /** 회신 분석 대상 메일 목록 */
  replyMails?: import("@/types").ReplyMail[];
  replyTo?: string[];
  replyCc?: string[];
  /** 답장 중인 원본 메일 제목 */
  replySubject?: string;
  /** 패널이 열린 상태에서 회신 재요청 시 증가 — 새 플로우를 강제 재시작 */
  replyTriggerKey?: number;
  /** content script에서 감지한 회신 사전 검증 에러 코드 */
  replyError?: string;
  /** 회신 분석 요청 함수 (summary + analysis 병렬 호출) */
  onReplyAnalysisRequest?: (
    mails: import("@/types").ReplyMail[],
    to?: string[],
    cc?: string[],
  ) => Promise<{
    analysis: import("@/types").ReplyAnalysisResponse | null;
    summaries: string[];
  }>;
  /** 회신 분석 중 중단하기 — 요청 abort 후 패널 닫기 */
  onReplyAnalysisCancel?: () => void;
  /** MAIL_READ 약관 동의 함수 (동의 후 회신 플로우 재시작) */
  onAgreeMailRead?: () => Promise<void>;
  /** 회신 작성 요청 함수 */
  onReplyWriteRequest?: (
    data: import("@/types").ReplyRequest,
  ) => Promise<import("@/types").ReplyResponse>;
  /** 회신 완료 콜백 */
  onReplySuccess?: (subject: string, content: string) => void;
  /** 교정 항목 없음 화면의 "확인" 버튼 콜백 */
  onNoCorrectionConfirm?: () => void;
}

// =============================================================
// 로딩 메시지
// =============================================================

const getLoadingMessage = (
  elapsed: number,
  receiverLabel: string,
  purposeLabel: string,
): string => {
  if (elapsed < 5) return `${receiverLabel}에게 맞는 표현을 찾고 있어요.`;
  if (elapsed < 10) return `${purposeLabel}에 맞는 초안을 준비하고 있어요.`;
  return "초안을 완성하고 있어요. 잠깐만요.";
};

// =============================================================
// 서브 컴포넌트
// =============================================================

/** 교정 항목 없음 화면 */
const PanelNoCorrectionBody = ({ onConfirm }: { onConfirm?: () => void }) => (
  <div className="flex flex-col items-center justify-between h-full px-4 pt-8 pb-6">
    <div className="flex flex-col items-center gap-4 flex-1 justify-center">
      <NoCorrectionIcon size={160} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xl-plus font-semibold leading-height-xl tracking-tight text-text-primary">
          더 고칠 부분이 없어요
        </p>
        <p className="text-base font-normal leading-6 text-text-secondary whitespace-pre-line">
          {
            "지금 메일은 그대로 보내도 좋아요.\n작성창에서 마지막으로 확인해 주세요."
          }
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onConfirm}
      className="w-full h-12 rounded-xl bg-background-brand text-text-inverse font-semibold text-base"
    >
      확인
    </button>
  </div>
);

/** 이메일 생성 중 로딩 본문 */
const PanelLoadingBody = ({
  receiverLabel,
  purposeLabel,
  onCancel,
  message,
}: {
  receiverLabel: string;
  purposeLabel: string;
  onCancel?: () => void;
  message?: string;
}) => {
  const [elapsed, setElapsed] = useState(0);

  // 경과 시간 — 로딩 메시지 전환용
  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* AI 연필 쓰기 애니메이션 */}
        <div className="shrink-0">
          <AIPencilWritingIcon size={160} />
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col gap-2 items-center text-center w-80">
          <h6 className="text-xl font-medium leading-7 tracking-tight text-text-primary whitespace-pre-line">
            {message ?? getLoadingMessage(elapsed, receiverLabel, purposeLabel)}
          </h6>
          {!message && (
            <p className="text-sm font-normal leading-5.5 tracking-tight text-text-tertiary">
              입력하신 내용을 바탕으로
              <br />
              자연스러운 톤의 이메일을 만드는 중입니다.
            </p>
          )}
        </div>
      </div>

      {/* 취소 버튼 — 익스텐션 전용 */}
      {onCancel && (
        <div className="w-full shrink-0">
          <ButtonLongV2 onClick={onCancel}>중단하기</ButtonLongV2>
        </div>
      )}
    </div>
  );
};

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
const PanelReplyConsentBody = ({
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

/** 회신 분석 로딩 화면 (call) */
const PanelReplyAnalysisLoadingBody = ({
  onCancel,
}: {
  onCancel?: () => void;
}) => (
  <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <MailReadingIcon size={60} />
      <p className="text-xl font-semibold leading-7 tracking-tight text-text-primary text-center">
        받은 메일을 읽고,
        <br />
        답할 질문을 추리고 있어요.
      </p>
    </div>
    {onCancel && (
      <div className="w-full shrink-0">
        <ButtonLongV2 onClick={onCancel}>중단하기</ButtonLongV2>
      </div>
    )}
  </div>
);

/** 회신 작성 로딩 화면 (load) — 10초 후 점검 메시지로 전환 */
const PanelReplyWriteLoadingBody = ({
  onCancel,
}: {
  onCancel?: () => void;
}) => {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <MailReadingIcon size={60} />
          <p className="text-xl font-semibold leading-7 tracking-tight text-text-primary text-center">
            이상이 없는지
            <br />
            꼼꼼히 살펴볼게요.
          </p>
        </div>
        {onCancel && (
          <div className="w-full shrink-0">
            <ButtonLongV2 onClick={onCancel}>중단하기</ButtonLongV2>
          </div>
        )}
      </div>
    );
  }

  return (
    <PanelLoadingBody
      receiverLabel=""
      purposeLabel=""
      message={"답해주신 내용으로\n회신을 작성하고 있어요"}
      onCancel={onCancel}
    />
  );
};

/** 회신 완료 화면 (done) */
const PanelReplySuccessBody = ({
  onCorrect,
  onReset,
}: {
  onCorrect: () => void;
  onReset: () => void;
}) => (
  <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <MailPackingIcon size={88} />
      <div className="flex flex-col gap-2 items-center text-center">
        <p className="text-xl font-semibold leading-7 tracking-tight text-text-primary">
          작성창에 회신 초안을 넣어뒀어요
        </p>
        <p className="text-sm font-normal leading-5.5 tracking-tight text-text-secondary text-center">
          초안은 자동으로 전송되지않아요
          <br />
          보내기 전에 한 번 더 다듬을 수 있어요
        </p>
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

/** 회신 질문 답변 입력 폼 (input) */
const PanelReplyInputBody = ({
  analysis,
  summaries,
  originalSubject,
  onSubmit,
}: {
  analysis: import("@/types").ReplyAnalysisResponse;
  summaries: string[];
  originalSubject?: string;
  onSubmit: (data: import("@/types").ReplyRequest) => void;
}) => {
  const [receiver, setReceiver] = useState<ReceiverType | null>(
    analysis.recipient?.type ?? null,
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [freeInput, setFreeInput] = useState("");
  const [extraMessage, setExtraMessage] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);

  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;
  const hasQuestions = analysis.questions.length > 0;
  const canSubmit =
    !!receiver &&
    (hasQuestions
      ? answeredCount >= Math.min(2, analysis.questions.length)
      : freeInput.trim().length > 0);

  const handleSubmit = () => {
    if (!receiver) return;
    const answerItems = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([id, answer]) => ({ question_id: Number(id), answer }));
    onSubmit({
      conversation: analysis.conversation,
      receiver_type: receiver,
      original_subject: originalSubject || undefined,
      questions: analysis.questions.length > 0 ? analysis.questions : undefined,
      answers: answerItems.length > 0 ? answerItems : undefined,
      free_input: freeInput.trim() || undefined,
      extra_message: extraMessage.trim() || undefined,
    });
  };

  return (
    <div className="bg-background-page flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
        {/* 헤더 */}
        <div className="px-2.5">
          <h2 className="text-2xl font-bold leading-8 tracking-tight text-text-primary">
            받은 메일을 읽고,
            <br />
            답장에 필요한 질문을 추렸어요
          </h2>
        </div>

        {/* 메일 요약 카드 */}
        <div className="bg-background-surface rounded-2xl p-3.5 shadow-[0px_1px_4px_rgba(124,77,255,0.1)]">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
              메일 요약
            </span>
            <button
              type="button"
              onClick={() => setSummaryOpen((o) => !o)}
              className="text-text-tertiary cursor-pointer"
              aria-label={summaryOpen ? "접기" : "펼치기"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${summaryOpen ? "rotate-90" : ""}`}
              >
                <path
                  d="M13.8297 10.8192C14.3984 10.4211 14.3984 9.57887 13.8297 9.18077L6.57346 4.10142C5.91069 3.63748 5 4.11163 5 4.92066L5 15.0793C5 15.8884 5.91069 16.3625 6.57346 15.8986L13.8297 10.8192Z"
                  fill="#D2D6E1"
                />
              </svg>
            </button>
          </div>
          {summaryOpen && summaries.length > 0 && (
            <>
              <div className="border-t border-border-subtle w-full my-2.5" />
              <div className="flex flex-col gap-1.5">
                {summaries.map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1 px-1.5 py-1 rounded-sm"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mt-0.5"
                    >
                      <path
                        d="M7.29338 2.22711C7.05537 2.07868 6.7805 2 6.5 2C6.18699 1.99981 5.88177 2.09759 5.62714 2.27963C5.3725 2.46166 5.18122 2.71882 5.08012 3.01505L4.55535 4.55488L3.01703 5.07965L2.84011 5.15162C2.57346 5.28215 2.35157 5.4889 2.20256 5.74568C2.05354 6.00245 1.98411 6.29768 2.00306 6.59395C2.02201 6.89023 2.12848 7.17421 2.309 7.4099C2.48951 7.6456 2.73593 7.8224 3.01703 7.9179L4.55685 8.44267L5.08162 9.981L5.15359 10.1564C5.28399 10.4231 5.49062 10.6451 5.7473 10.7942C6.00398 10.9433 6.29916 11.0129 6.59542 10.9941C6.89168 10.9753 7.1757 10.869 7.41149 10.6887C7.64727 10.5083 7.82421 10.262 7.91988 9.981L8.44465 8.44117L9.98297 7.9164L10.1599 7.84444C10.4265 7.7139 10.6484 7.50715 10.7974 7.25038C10.9465 6.99361 11.0159 6.69837 10.9969 6.4021C10.978 6.10583 10.8715 5.82185 10.691 5.58615C10.5105 5.35045 10.2641 5.17365 9.98297 5.07815L8.44315 4.55338L7.91838 3.01505L7.84641 2.83963C7.72299 2.58775 7.53139 2.37553 7.29338 2.22711Z"
                        fill="#7C4DFF"
                      />
                    </svg>
                    <p className="text-xs font-normal leading-4.5 tracking-tight text-text-secondary">
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 수신자 유형 */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-3">
            <p className="text-base font-semibold leading-6 tracking-tight text-text-primary shrink-0">
              수신자 유형 선택
            </p>
            <p className="text-xs font-normal leading-4 tracking-tight text-text-placeholder">
              *AI가 미리 골라뒀어요
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {RECEIVER_OPTIONS.map(({ value, label }) => (
              <ChipV2
                key={value}
                selected={receiver === value}
                size="md"
                onClick={() => setReceiver(receiver === value ? null : value)}
              >
                {label}
              </ChipV2>
            ))}
          </div>
        </div>

        {/* 회신에 필요한 정보 (질문) */}
        {analysis.questions.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="px-3">
              <p className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                회신에 필요한 정보
              </p>
            </div>
            <div className="bg-background-surface rounded-2xl p-4 shadow-[0px_1px_4px_rgba(124,77,255,0.1)]">
              <div className="flex flex-col gap-5">
                {analysis.questions.map((q, i) => (
                  <div key={q.id}>
                    {i > 0 && (
                      <div className="border-t border-border-subtle w-full mb-5" />
                    )}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start gap-2">
                        <span className="bg-background-brand text-text-inverse text-xs font-semibold leading-4 tracking-tight px-2.5 py-0.5 rounded-full min-w-[35px] text-center">
                          Q{q.id}
                        </span>
                        <p className="flex-1 text-sm font-semibold leading-5 tracking-tight text-text-primary">
                          {q.question}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="답변을 작성해주세요."
                        className="w-full bg-background-subtle border border-border-default rounded-lg px-4 py-3 text-sm font-normal leading-5.5 tracking-tight text-text-primary placeholder:text-text-placeholder outline-none focus:border-border-focus"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 자유 입력 (질문 없을 때) */}
        {!hasQuestions && (
          <div className="flex flex-col gap-2.5">
            <div className="px-3">
              <p className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                회신에 필요한 정보
              </p>
            </div>
            <textarea
              value={freeInput}
              onChange={(e) => setFreeInput(e.target.value)}
              placeholder="전하려는 내용을 입력해주세요"
              rows={4}
              className="w-full bg-background-surface border border-border-default rounded-2xl px-4 py-3 text-sm font-normal leading-5.5 tracking-tight text-text-primary placeholder:text-text-placeholder outline-none focus:border-border-focus resize-none"
            />
          </div>
        )}

        {/* 추가로 전할 말 (선택) */}
        <div className="flex flex-col gap-2.5">
          <div className="px-3">
            <p className="text-base font-semibold leading-6 tracking-tight text-text-primary">
              추가로 전할 말 <span>(선택)</span>
            </p>
          </div>
          <textarea
            value={extraMessage}
            onChange={(e) => setExtraMessage(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={4}
            className="w-full bg-background-surface border border-border-default rounded-2xl px-4 py-3 text-xs font-normal leading-4.5 tracking-tight text-text-primary placeholder:text-text-placeholder outline-none focus:border-border-focus resize-none"
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 py-3 shrink-0 bg-gradient-to-t from-background-page via-background-page to-transparent pt-6">
        <ButtonLongV2 onClick={handleSubmit} disabled={!canSubmit}>
          회신 작성하기
        </ButtonLongV2>
      </div>
    </div>
  );
};

/** 회신 완료 화면 */

/** 교정 완료 요약 화면 */
const PanelCorrectionSuccessBody = ({
  acceptedChanges,
  rejectedChanges,
  totalCount,
  onReset,
}: {
  acceptedChanges: CorrectionChange[];
  rejectedChanges: CorrectionChange[];
  totalCount: number;
  onReset: () => void;
}) => (
  <div className="flex-1 flex flex-col justify-between h-full overflow-hidden bg-background-page">
    <div className="flex-1 overflow-y-auto px-4 py-10 flex flex-col gap-10">
      {/* 상단: 아이콘 + 타이틀 */}
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center justify-center size-25">
          <svg
            width="55"
            height="60"
            viewBox="0 0 55 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 봉투 몸체 */}
            <rect
              x="3"
              y="25"
              width="49"
              height="32"
              rx="5"
              fill="white"
              stroke="#7C4DFF"
              strokeWidth="3.2"
            />
            {/* 봉투 플랩 */}
            <path
              d="M3 30L27.5 46L52 30"
              stroke="#7C4DFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 편지지 */}
            <rect
              x="12"
              y="3"
              width="31"
              height="36"
              rx="4"
              fill="white"
              stroke="#7C4DFF"
              strokeWidth="3.2"
            />
            {/* 편지 줄 */}
            <line
              x1="18"
              y1="14"
              x2="37"
              y2="14"
              stroke="#7C4DFF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1="18"
              y1="21"
              x2="37"
              y2="21"
              stroke="#9B78FF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1="18"
              y1="28"
              x2="31"
              y2="28"
              stroke="#BFA7FF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-3.5 items-center text-center">
          <p className="text-xl-plus font-semibold leading-7.5 tracking-tight text-text-primary">
            교정안을 작성칸에 넣어뒀어요.
          </p>
          <p className="text-base font-normal leading-6 tracking-tight text-text-secondary text-center">
            필요한 부분은 작성칸에서
            <br />한 번 더 다듬어 보낼 수 있어요.
          </p>
        </div>
      </div>

      {/* 교정 요약 + 상세 카드 */}
      <div className="flex flex-col gap-3.5">
        {/* 교정 요약 카드 */}
        <div className="bg-background-surface rounded-2xl p-3 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                교정 요약
              </span>
              <span className="text-xs font-semibold leading-4 tracking-tight text-text-brand">
                총 {totalCount}건
              </span>
            </div>
            <div className="flex gap-2.5 items-center text-center">
              <div className="flex-1 flex flex-col gap-1 items-center px-2.5 py-2.5 rounded-2xl bg-background-brand-subtle text-text-brand">
                <span className="text-2xl font-bold leading-8 tracking-tight">
                  {acceptedChanges.length}
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight">
                  반영
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center px-2.5 py-2.5 rounded-2xl bg-background-subtle text-text-secondary">
                <span className="text-2xl font-bold leading-8 tracking-tight">
                  {rejectedChanges.length}
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight whitespace-nowrap">
                  원문 유지
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center px-2.5 py-2.5 rounded-2xl bg-background-subtle text-text-placeholder">
                <span className="text-2xl font-bold leading-8 tracking-tight">
                  0
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight">
                  미검토
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 반영/원문유지 상세 카드 */}
        <div className="bg-background-surface rounded-2xl p-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] flex flex-col gap-4">
          {/* 반영된 교정 */}
          {acceptedChanges.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                  반영된 교정
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight text-text-brand">
                  {acceptedChanges.length}건
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {acceptedChanges.map((c, i) => (
                  <div key={c.index} className="flex gap-2.5 items-center">
                    <div className="bg-background-brand flex flex-col items-center justify-center px-2.5 py-0.5 rounded-full shrink-0 min-w-9">
                      <span className="text-xs font-semibold leading-4 text-text-inverse text-center">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex flex-1 gap-1.5 items-center min-w-0">
                      <p className="flex-1 text-xs font-semibold leading-4 text-text-tertiary truncate min-w-0 max-w-20">
                        {c.original}
                      </p>
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="9"
                          height="11"
                          viewBox="0 0 9 11"
                          fill="none"
                        >
                          <path
                            d="M7.75192 4.30125C8.34566 4.69707 8.34566 5.56953 7.75192 5.96535L1.5547 10.0968C0.890147 10.5399 4.75901e-07 10.0635 5.10813e-07 9.26478L8.71999e-07 1.00182C9.06911e-07 0.203122 0.890147 -0.273269 1.5547 0.169768L7.75192 4.30125Z"
                            fill="#7C4DFF"
                          />
                        </svg>
                      </span>
                      <p className="flex-1 text-xs font-semibold leading-4 text-text-primary truncate min-w-0">
                        {c.corrected}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 구분선 */}
          {acceptedChanges.length > 0 && rejectedChanges.length > 0 && (
            <div className="h-px w-full bg-border-subtle" />
          )}

          {/* 원문 유지 */}
          {rejectedChanges.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold leading-6 tracking-tight text-text-primary">
                  원문 유지
                </span>
                <span className="text-xs font-semibold leading-4 tracking-tight text-text-secondary">
                  {rejectedChanges.length}건
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {rejectedChanges.map((c, i) => (
                  <div key={c.index} className="flex gap-2.5 items-center">
                    <div className="bg-background-muted flex flex-col items-center justify-center px-2.5 py-0.5 rounded-full shrink-0 min-w-9">
                      <span className="text-xs font-semibold leading-4 text-text-placeholder text-center">
                        {String(acceptedChanges.length + i + 1).padStart(
                          2,
                          "0",
                        )}
                      </span>
                    </div>
                    <p className="flex-1 text-xs font-semibold leading-4 text-text-placeholder truncate min-w-0">
                      {c.original}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* 하단 버튼 */}
    <div className="px-4 pb-3 shrink-0">
      <ButtonLongV2 onClick={onReset}>새 교정 시작하기</ButtonLongV2>
    </div>
  </div>
);

/** 생성/교정 성공 화면 */
const PanelSuccessBody = ({
  mode = "demo",
  panelMode,
  draftText = "",
  onReset,
  showToast,
}: {
  mode?: "demo" | "extension";
  panelMode?: PanelMode;
  draftText?: string;
  onReset: () => void;
  showToast?: (message: string) => void;
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(draftText)
      .then(() => {
        setCopied(true);
        showToast?.("복사했어요. 작성창에 붙여넣으면 돼요.");
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {});
  }, [draftText, showToast]);

  const isDraftMode = mode === "extension" && panelMode !== "correct";

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full gap-5 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center py-12 min-h-0 gap-5">
        {isDraftMode ? (
          <MailPackingIcon size={88} />
        ) : (
          <div className="size-15 rounded-full bg-action-primary-default flex items-center justify-center shrink-0">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M5.25 14L11.375 20.125L22.75 7.875"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <div className="flex flex-col gap-3.5 items-center text-center shrink-0">
          <p className="text-xl-plus font-semibold leading-7.5 tracking-tight text-text-primary">
            {panelMode === "correct" ? (
              <>
                다듬은 메일을 작성칸에 넣어뒀어요.
                <br />
                확인하고 보내 주세요.
              </>
            ) : isDraftMode ? (
              "초안이 준비됐어요"
            ) : (
              <>
                쓰는 법을 몰라도 된다는 게,
                <br />
                이제 느껴지셨나요?
              </>
            )}
          </p>
          <p className="text-base font-normal leading-6 tracking-tight text-text-secondary text-center">
            {panelMode === "correct" ? (
              <>
                필요한 부분은 작성칸에서
                <br />한 번 더 다듬어 보낼 수 있어요.
              </>
            ) : isDraftMode ? (
              "Gmail 작성창에 담아뒀어요."
            ) : (
              "간단히 설치하고, 매번 이렇게 완성해보세요."
            )}
          </p>
        </div>

        {isDraftMode && (
          <div className="w-full bg-background-surface rounded-2xl p-3.5 shadow-[0px_1px_4px_rgba(124,77,255,0.1)] flex flex-col gap-2.5 h-62.5">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="9"
                    height="9"
                    viewBox="0 0 9 9"
                    fill="none"
                  >
                    <path
                      d="M5.29338 0.227108C5.05537 0.0786829 4.7805 0 4.5 0C4.18699 -0.00018784 3.88177 0.0975907 3.62714 0.279626C3.3725 0.46166 3.18122 0.718823 3.08012 1.01505L2.55535 2.55488L1.01703 3.07965L0.840106 3.15162C0.573463 3.28215 0.351574 3.4889 0.202558 3.74568C0.0535424 4.00245 -0.0158909 4.29768 0.00305782 4.59395C0.0220065 4.89023 0.128483 5.17421 0.308996 5.4099C0.489508 5.6456 0.735929 5.8224 1.01703 5.9179L2.55685 6.44267L3.08162 7.981L3.15359 8.15642C3.28399 8.4231 3.49062 8.64508 3.7473 8.79421C4.00398 8.94334 4.29916 9.01292 4.59542 8.99414C4.89168 8.97535 5.1757 8.86904 5.41149 8.68868C5.64727 8.50831 5.82421 8.26202 5.91988 7.981L6.44465 6.44117L7.98297 5.9164L8.15989 5.84444C8.42654 5.7139 8.64843 5.50715 8.79744 5.25038C8.94646 4.99361 9.01589 4.69837 8.99694 4.4021C8.97799 4.10583 8.87152 3.82185 8.691 3.58615C8.51049 3.35045 8.26407 3.17365 7.98297 3.07815L6.44315 2.55338L5.91838 1.01505L5.84641 0.839632C5.72299 0.587746 5.53139 0.375532 5.29338 0.227108Z"
                      fill="#7C4DFF"
                    />
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
                {copied ? (
                  <Icon
                    name="check-circle"
                    size={18}
                    color="var(--color-text-brand)"
                  />
                ) : (
                  <Icon
                    name="copy"
                    size={18}
                    color="var(--color-border-strong)"
                  />
                )}
              </button>
            </div>
            <div className="h-px bg-border-default shrink-0" />
            <div className="overflow-y-auto min-h-0 my-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-background-muted [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              <p className="text-xs text-text-secondary tracking-tight leading-4.5 whitespace-pre-wrap px-1.5 py-1">
                {draftText}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full shrink-0 flex flex-col gap-2">
        {mode === "demo" ? (
          <ButtonLongV2
            onClick={() =>
              window.open(
                "https://chromewebstore.google.com/category/extensions",
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            ToneFit 시작하기
          </ButtonLongV2>
        ) : (
          <ButtonLongV2 onClick={onReset}>새 초안 만들기</ButtonLongV2>
        )}
      </div>
    </div>
  );
};

// =============================================================
// 에러 variant 타입
// =============================================================

export type ReplyErrorVariant =
  | "reply_empty"
  | "reply_no_quote"
  | "reply_too_long"
  | "reply_non_korean"
  | "reply_api_error"
  | "reply_extract_error";

export type ErrorVariant =
  | "generic"
  | "session_expired"
  | "rate_limited"
  | ReplyErrorVariant;

const REPLY_ERROR_VARIANTS = new Set<string>([
  "reply_empty",
  "reply_no_quote",
  "reply_too_long",
  "reply_non_korean",
  "reply_api_error",
  "reply_extract_error",
]);

const REPLY_ERROR_CONFIG: Record<
  ReplyErrorVariant,
  { title: string; desc: string }
> = {
  reply_empty: {
    title: "메일 내용을 읽지 못했어요.",
    desc: "대화를 펼친 뒤 다시 시도해 주세요.",
  },
  reply_no_quote: {
    title: "답장할 대화가 보이지 않아요.",
    desc: "받은 메일을 연 상태에서 다시 시도해 주세요.",
  },
  reply_too_long: {
    title: "대화가 길어 정리하기 어려워요.",
    desc: "필요한 내용만 남기고 다시 시도해 주세요.",
  },
  reply_non_korean: {
    title: "한국어 메일만 도와드릴 수 있어요.",
    desc: "한국어 메일을 연 상태에서 다시 시도해 주세요.",
  },
  reply_api_error: {
    title: "요청이 많아 잠시 쉬어갈게요.",
    desc: "잠시 후 다시 시도해 주세요.",
  },
  reply_extract_error: {
    title: "메일 내용을 읽지 못했어요.",
    desc: "대화를 펼친 뒤 다시 시도해 주세요.",
  },
};

/** 에러 variant별 텍스트 설정 — 모드(generate/correct)별 분기 */
type ErrorConfigEntry = {
  title: string;
  descLine1: string;
  descLine2: string;
  descLine3?: string;
};
const ERROR_CONFIG: Record<
  Exclude<ErrorVariant, ReplyErrorVariant>,
  Record<PanelMode, ErrorConfigEntry>
> = {
  generic: {
    generate: {
      title: "초안 생성을 완료하지 못했어요",
      descLine1: "잠시 후 다시 시도해 주세요.",
      descLine2: "",
    },
    correct: {
      title: "교정을 완료하지 못했어요",
      descLine1: "처리 중에 일시적인 문제가 생겼어요.",
      descLine2: "",
    },
    reply: {
      title: "회신 작성을 완료하지 못했어요",
      descLine1: "처리 중에 일시적인 문제가 생겼어요.",
      descLine2: "잠시 후 다시 시도해 주세요.",
    },
  },
  session_expired: {
    generate: {
      title: "로그인이 만료되었어요.",
      descLine1: "다시 로그인하면 이어서 생성할 수 있어요.",
      descLine2: "",
    },
    correct: {
      title: "로그인이 만료되었어요.",
      descLine1: "다시 로그인하면 이어서 교정할 수 있어요.",
      descLine2: "",
    },
    reply: {
      title: "로그인이 만료되었어요.",
      descLine1: "다시 로그인해 주세요.",
      descLine2: "",
    },
  },
  rate_limited: {
    generate: {
      title: "잠시만 기다려 주세요",
      descLine1: "짧은 시간에 생성 요청이 많았어요.",
      descLine2: "1분 후 다시 시도해 주세요.",
      descLine3: "",
    },
    correct: {
      title: "잠시만 기다려 주세요",
      descLine1: "짧은 시간에 교정 요청이 많았어요.",
      descLine2: "1분 후 다시 시도해 주세요.",
    },
    reply: {
      title: "한도가 초과되었어요",
      descLine1: "잠시 후 재시도 해주세요.",
      descLine2: "",
    },
  },
};

/** 생성 실패 화면 */
const PanelErrorBody = ({
  variant = "generic",
  panelMode = "generate",
  onRetry,
  onGoToLogin,
}: {
  variant?: ErrorVariant;
  panelMode?: PanelMode;
  onRetry: () => void;
  onGoToLogin?: () => void;
}) => {
  // rate_limited: 60초 카운트다운 → 0 도달 시 다시 시도 버튼 활성화
  const [countdown, setCountdown] = useState(
    variant === "rate_limited" ? 60 : 0,
  );

  useEffect(() => {
    if (variant !== "rate_limited") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [variant]);

  const isReplyVariant = REPLY_ERROR_VARIANTS.has(variant);

  // 회신 전용 에러
  if (isReplyVariant) {
    const { title, desc } = REPLY_ERROR_CONFIG[variant as ReplyErrorVariant];
    return (
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-10 py-12">
          <div className="shrink-0">
            <ErrorNoticeIcon size={120} />
          </div>
          <div className="flex flex-col gap-3.5 items-center text-center w-full">
            <p className="text-2xl font-semibold leading-7.5 tracking-tight text-text-primary">
              {title}
            </p>
            <p className="text-base font-normal leading-6 tracking-tight text-text-tertiary text-center whitespace-pre-line">
              {desc}
            </p>
          </div>
        </div>
        <div className="w-full shrink-0">
          <ButtonLongV2 onClick={onRetry}>다시 시도</ButtonLongV2>
        </div>
      </div>
    );
  }

  const { title, descLine1, descLine2, descLine3 } =
    ERROR_CONFIG[variant as Exclude<ErrorVariant, ReplyErrorVariant>][
      panelMode
    ];

  // CTA 버튼 설정
  const isCounting = variant === "rate_limited" && countdown > 0;
  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");
  const buttonLabel =
    variant === "session_expired"
      ? "로그인하기"
      : isCounting
        ? `${mm}:${ss}`
        : "다시 시도";
  const handleAction =
    variant === "session_expired" ? (onGoToLogin ?? onRetry) : onRetry;

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 py-5 h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-10 py-12">
        <div className="shrink-0">
          {variant === "session_expired" ? (
            <LoginExpiredIcon size={120} />
          ) : (
            <ErrorNoticeIcon size={120} />
          )}
        </div>
        <div className="flex flex-col gap-3.5 items-center text-center w-full">
          <p className="text-2xl font-semibold leading-7.5 tracking-tight text-text-primary">
            {title}
          </p>
          <p className="text-base font-normal leading-6 tracking-tight text-text-tertiary text-center">
            {descLine1}
            <br />
            {descLine2}
            {descLine3 && (
              <>
                <br />
                {descLine3}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="w-full shrink-0">
        <ButtonLongV2 onClick={handleAction} disabled={isCounting}>
          {buttonLabel}
        </ButtonLongV2>
      </div>
    </div>
  );
};

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
// 교정 결과 리뷰 패널
// =============================================================

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
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13.3337 6H6.33366C5.3612 6 4.42857 6.38631 3.74093 7.07394C3.0533 7.76157 2.66699 8.69421 2.66699 9.66667C2.66699 10.1482 2.76183 10.625 2.9461 11.0698C3.13037 11.5147 3.40045 11.9189 3.74093 12.2594C4.42857 12.947 5.3612 13.3333 6.33366 13.3333H8.66699"
      stroke="#7C4DFF"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
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

const PanelCorrectionReviewBody = ({
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

// =============================================================
// 입력 폼 패널 본문
// =============================================================

/** 입력 폼 패널 본문 */
const PanelBody = ({
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

          {/* 목적 */}
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
                  stroke-width="1.16667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M7 9.33333V7"
                  stroke="#9AA1B2"
                  stroke-width="1.16667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M7 4.66663H7.00583"
                  stroke="#9AA1B2"
                  stroke-width="1.16667"
                  stroke-linecap="round"
                  stroke-linejoin="round"
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

// =============================================================
// 패널 헤더 (독립 컴포넌트)
// =============================================================

/**
 * 패널 헤더 — 로고 + 잔여 횟수 뱃지
 *
 * 데모 페이지에서는 표시 / 익스텐션 사이드 패널에서는 숨김
 * ToneFitPanel의 showHeader prop으로 제어하거나, 독립적으로 사용 가능
 */
export const PanelHeader = ({ remainingCount }: { remainingCount: number }) => (
  <div className="flex items-center justify-between px-4 py-5 shrink-0">
    <div className="flex items-center gap-2.5">
      <img src={imgPanelIcon} alt="ToneFit" className="size-8 object-contain" />
      <span className="text-lg font-semibold leading-[26px] tracking-tight text-text-primary">
        이메일 생성
      </span>
    </div>
    <button
      type="button"
      className="w-27 h-7 bg-background-selected border border-border-brand rounded-full text-xs font-semibold leading-4 tracking-tight text-text-brand"
    >
      {remainingCount}회 무료체험 가능
    </button>
  </div>
);

// =============================================================
// 메인 컴포넌트
// =============================================================

const ToneFitPanel = ({
  remainingCount,
  onRequest,
  onSuccess,
  onReset,
  onExhausted,
  showHeader = true,
  mode = "demo",
  tooltipSlot,
  onChipSelect,
  onCancel,
  onError,
  errorVariant = "generic",
  onGoToLogin,
  onCorrectionsRejected,
  devForceView,
  devPanelMode: devPanelModeProp,
  initialPanelMode,
  requestedPanelMode,
  onPreCheck,
  replyMails,
  replyTo,
  replyCc,
  replySubject,
  replyTriggerKey,
  replyError,
  onAgreeMailRead,
  onReplyAnalysisRequest,
  onReplyAnalysisCancel,
  onReplyWriteRequest,
  onReplySuccess,
  onNoCorrectionConfirm,
}: ToneFitPanelProps) => {
  const CORRECTION_HINT_KEY = "tonefit_correction_hint_dismissed";
  const [panelMode, setPanelMode] = useState<PanelMode>(
    initialPanelMode ?? "generate",
  );
  const [view, setView] = useState<PanelView>("input");

  // 툴바 버튼 재클릭 시 input 뷰에서만 모드 갱신
  useEffect(() => {
    if (requestedPanelMode && view === "input") {
      startTransition(() => setPanelMode(requestedPanelMode));
    }
  }, [requestedPanelMode, view]);

  const [showCorrectionHint, setShowCorrectionHint] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [receiver, setReceiver] = useState<ReceiverType | null>(null);
  const [purpose, setPurpose] = useState<PurposeType | null>(null);
  const [emailText, setEmailText] = useState("");
  const [correctionSession, setCorrectionSession] = useState<Extract<
    GenerateResult,
    { type: "correction" }
  > | null>(null);
  const [correctionSummary, setCorrectionSummary] = useState<{
    acceptedChanges: CorrectionChange[];
    rejectedChanges: CorrectionChange[];
    totalCount: number;
  } | null>(null);
  const cancelledRef = useRef(false);
  const [replyAnalysis, setReplyAnalysis] = useState<
    import("@/types").ReplyAnalysisResponse | null
  >(null);
  const [replySummaries, setReplySummaries] = useState<string[]>([]);
  const replyStartedRef = useRef(false);
  const [internalErrorVariant, setInternalErrorVariant] =
    useState<ErrorVariant | null>(null);
  const [draftText, setDraftText] = useState<string>("");

  /** 모드 전환 — 교정 모드 최초 진입 시에만 안내 배너 표시 */

  const handleModeChange = useCallback((m: PanelMode) => {
    setPanelMode(m);
    if (m === "correct") {
      const dismissed = localStorage.getItem(CORRECTION_HINT_KEY) === "true";
      if (!dismissed) setShowCorrectionHint(true);
    }
  }, []);

  /**
   * 폼 입력 조건 (잔여 횟수 제외)
   * 교정 모드: 수신자 + 목적만 필요 (내용은 Gmail에서 자동 읽기)
   * 생성 모드: 수신자 + 목적 + 이메일 내용 필요
   */
  const canGenerateForm =
    panelMode === "correct"
      ? !!receiver && !!purpose
      : !!receiver &&
        !!purpose &&
        emailText.trim().length >= 10 &&
        emailText.length <= EMAIL_MAX &&
        !isOnlyJamoOrSpaces(emailText);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  /** 생성/교정 요청 — 횟수 소진 시 onExhausted 호출, 정상 시 로딩 → 성공/실패 전환 */
  const handleGenerate = useCallback(async () => {
    if (!canGenerateForm || !receiver || !purpose) return;

    // 잔여 횟수 소진 → 팝업 표시 (부모 처리)
    if (remainingCount === 0) {
      onExhausted?.();
      return;
    }

    cancelledRef.current = false;

    // 교정 모드: loading 전에 사전 검증 (본문 길이 등)
    if (panelMode === "correct" && onPreCheck) {
      try {
        await onPreCheck();
      } catch (err) {
        const e = err as {
          _noCompose?: boolean;
          _empty?: boolean;
          _tooShort?: boolean;
          _fetchError?: boolean;
        };
        if (e._noCompose) {
          showToast("Gmail 작성창을 열어둔 뒤 다시 시도해 주세요.");
        } else if (e._empty) {
          showToast("Gmail 작성창에 메일 본문을 작성해 주세요.");
        } else if (e._tooShort) {
          showToast("본문을 40자 이상 작성하면 교정을 시작할 수 있어요.");
        } else if (e._fetchError) {
          showToast("메일 본문을 읽지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }
    }

    setView("loading");
    try {
      const result = await onRequest({
        receiver,
        purpose,
        emailText,
        correctionMode: panelMode === "correct",
      });
      if (cancelledRef.current) return;
      if (result.type === "correction") {
        setCorrectionSession(result);
        setView(
          result.changes.length === 0 ? "no-correction" : "correction-review",
        );
      } else {
        setDraftText(result.content);
        setView("success");
        onSuccess(result.subject, result.content);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      onError?.(err);
      setView("error");
    }
  }, [
    canGenerateForm,
    receiver,
    purpose,
    emailText,
    panelMode,
    remainingCount,
    onRequest,
    onSuccess,
    onExhausted,
    onError,
    onPreCheck,
    showToast,
    setView,
  ]);

  /** 로딩 중 취소 → 입력값 유지하고 input으로 복귀 */
  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setView("input");
    onCancel?.();
  }, [onCancel, setView]);

  const handleReplyWrite = useCallback(
    async (req: import("@/types").ReplyRequest) => {
      if (!onReplyWriteRequest) return;
      setView("reply-loading-write");
      try {
        const result = await onReplyWriteRequest(req);
        onReplySuccess?.(result.generated_subject, result.generated_email);
        setView("reply-success");
      } catch (err) {
        onError?.(err);
        setView("error");
      }
    },
    [onReplyWriteRequest, onReplySuccess, onError, setView],
  );

  /** 교정 리뷰 완료 — 최종 내용 삽입 + 거절 항목 전송 */

  const handleCorrectionComplete = useCallback(
    (
      finalContent: string,
      acceptedChanges: CorrectionChange[],
      rejectedItems: CorrectionsRejectionItem[],
    ) => {
      onSuccess("", finalContent);
      if (rejectedItems.length > 0 && correctionSession) {
        onCorrectionsRejected?.(
          rejectedItems,
          correctionSession.receiver,
          correctionSession.purpose,
        );
      }
      const totalCount = correctionSession?.changes.length ?? 0;
      const rejectedChanges = (correctionSession?.changes ?? []).filter((c) =>
        rejectedItems.some((r) => r.original_phrase === c.original),
      );
      setCorrectionSummary({ acceptedChanges, rejectedChanges, totalCount });
      setCorrectionSession(null);
      setView("success");
    },
    [onSuccess, onCorrectionsRejected, correctionSession, setView],
  );

  /** 성공 화면 → 입력 초기화 */
  const handleReset = () => {
    setCorrectionSession(null);
    setCorrectionSummary(null);
    setDraftText("");
    setView("input");
    setReceiver(null);
    setPurpose(null);
    setEmailText("");
    onReset();
  };

  /** 실패 화면 → 입력 유지하고 돌아가기 (reply 모드는 분석 재시작) */
  const handleRetry = () => {
    if (panelMode === "reply" && replyMails && onReplyAnalysisRequest) {
      setView("reply-loading-analysis");
      onReplyAnalysisRequest(replyMails, replyTo, replyCc)
        .then(({ analysis, summaries }) => {
          setReplyAnalysis(analysis);
          setReplySummaries(summaries);
          setView("reply-input");
        })
        .catch(() => setView("error"));
    } else {
      setView("input");
    }
  };

  const REPLY_ERROR_CODE_MAP: Record<string, ReplyErrorVariant> = {
    REPLY_EMPTY: "reply_empty",
    REPLY_NO_QUOTE: "reply_no_quote",
    REPLY_TOO_LONG: "reply_too_long",
    REPLY_NON_KOREAN: "reply_non_korean",
    REPLY_API_ERROR: "reply_api_error",
    REPLY_EXTRACT_ERROR: "reply_extract_error",
  };

  // reply 모드: 패널 열릴 때 자동으로 분석 시작 / 패널 열린 상태에서 재요청 시 재시작
  useEffect(() => {
    const isInitialReply =
      initialPanelMode === "reply" && !replyStartedRef.current;
    const isRetrigger = replyTriggerKey !== undefined && replyTriggerKey > 0;

    if (!isInitialReply && !isRetrigger) return;

    // content script에서 사전 검증 에러가 있으면 API 호출 없이 에러 화면으로
    if (replyError) {
      replyStartedRef.current = true;
      const variant: ErrorVariant =
        REPLY_ERROR_CODE_MAP[replyError] ?? "generic";
      startTransition(() => {
        setPanelMode("reply");
        setInternalErrorVariant(variant);
        setView("error");
      });
      return;
    }

    if (replyMails && onReplyAnalysisRequest) {
      replyStartedRef.current = true;
      startTransition(() => {
        setPanelMode("reply");
        setView("reply-loading-analysis");
      });
      onReplyAnalysisRequest(replyMails, replyTo, replyCc)
        .then(({ analysis, summaries }) => {
          if (!analysis) return; // 중단하기로 abort된 경우
          setReplyAnalysis(analysis);
          setReplySummaries(summaries);
          setView("reply-input");
        })
        .catch((err: unknown) => {
          const typedErr = err as {
            _termsRequired?: boolean;
            _replyApiError?: boolean;
          };
          if (typedErr._termsRequired) {
            setView("reply-consent");
          } else if (typedErr._replyApiError) {
            setInternalErrorVariant("reply_api_error");
            setView("error");
          } else {
            setView("error");
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialPanelMode,
    replyTriggerKey,
    replyError,
    replyMails,
    onReplyAnalysisRequest,
    replyTo,
    replyCc,
  ]);

  /** Mac: Cmd+Enter / Windows: Alt+Enter 로 생성 */
  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (isMac ? e.metaKey : e.altKey) {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate]);

  const activeView = devForceView ?? view;
  const activePanelMode = devPanelModeProp ?? panelMode;

  const receiverLabel =
    RECEIVER_OPTIONS.find((o) => o.value === receiver)?.label ?? "상사";
  const purposeLabel =
    PURPOSE_OPTIONS.find((o) => o.value === purpose)?.label ?? "보고";

  return (
    <>
      {/* 패널 헤더 — 데모: 표시 / 익스텐션: 숨김 */}
      {showHeader && <PanelHeader remainingCount={remainingCount} />}

      {/* 본문 */}
      {activeView === "loading" && (
        <PanelLoadingBody
          receiverLabel={receiverLabel}
          purposeLabel={purposeLabel}
          onCancel={onCancel ? handleCancel : undefined}
          message={
            activePanelMode === "correct"
              ? "문장의 흐름을 살펴보고 있어요."
              : undefined
          }
        />
      )}
      {activeView === "success" &&
        (activePanelMode === "correct" ? (
          <PanelCorrectionSuccessBody
            acceptedChanges={
              correctionSummary?.acceptedChanges ?? DEV_MOCK_CHANGES.slice(0, 2)
            }
            rejectedChanges={
              correctionSummary?.rejectedChanges ?? DEV_MOCK_CHANGES.slice(2)
            }
            totalCount={
              correctionSummary?.totalCount ?? DEV_MOCK_CHANGES.length
            }
            onReset={handleReset}
          />
        ) : (
          <PanelSuccessBody
            mode={mode}
            panelMode={activePanelMode}
            draftText={draftText}
            onReset={handleReset}
            showToast={showToast}
          />
        ))}
      {activeView === "error" && (
        <PanelErrorBody
          key={`${internalErrorVariant ?? errorVariant}-${activePanelMode}`}
          variant={internalErrorVariant ?? errorVariant}
          panelMode={activePanelMode}
          onRetry={handleRetry}
          onGoToLogin={onGoToLogin}
        />
      )}
      {activeView === "no-correction" && (
        <PanelNoCorrectionBody onConfirm={onNoCorrectionConfirm} />
      )}
      {activeView === "correction-review" && (
        <PanelCorrectionReviewBody
          changes={correctionSession?.changes ?? DEV_MOCK_CHANGES}
          originalEmail={correctionSession?.originalEmail ?? DEV_MOCK_ORIGINAL}
          receiver={correctionSession?.receiver ?? "DIRECT_SUPERVISOR"}
          purpose={correctionSession?.purpose ?? "REPORT"}
          onComplete={handleCorrectionComplete}
        />
      )}
      {activeView === "reply-consent" && (
        <PanelReplyConsentBody
          onAgree={async () => {
            if (onAgreeMailRead) await onAgreeMailRead();
            if (replyMails && onReplyAnalysisRequest) {
              setView("reply-loading-analysis");
              onReplyAnalysisRequest(replyMails, replyTo, replyCc)
                .then(({ analysis, summaries }) => {
                  setReplyAnalysis(analysis);
                  setReplySummaries(summaries);
                  setView("reply-input");
                })
                .catch(() => setView("error"));
            }
          }}
          onCancel={() => {
            setPanelMode("generate");
            setView("input");
          }}
        />
      )}
      {activeView === "reply-loading-analysis" && (
        <PanelReplyAnalysisLoadingBody onCancel={onReplyAnalysisCancel} />
      )}
      {activeView === "reply-input" && (
        <PanelReplyInputBody
          analysis={replyAnalysis ?? DEV_MOCK_REPLY_ANALYSIS}
          originalSubject={replySubject}
          summaries={
            replySummaries.length > 0
              ? replySummaries
              : DEV_MOCK_REPLY_SUMMARIES
          }
          onSubmit={handleReplyWrite}
        />
      )}
      {activeView === "reply-loading-write" && (
        <PanelReplyWriteLoadingBody
          onCancel={
            onCancel
              ? () => {
                  onCancel();
                  setView("reply-input");
                }
              : undefined
          }
        />
      )}
      {activeView === "reply-success" && (
        <PanelReplySuccessBody
          onCorrect={() => {
            setPanelMode("correct");
            setView("input");
          }}
          onReset={() => {
            replyStartedRef.current = false;
            setReplyAnalysis(null);
            setReplySummaries([]);
            setPanelMode("generate");
            setView("input");
          }}
        />
      )}
      {activeView === "input" && (
        <PanelBody
          panelMode={activePanelMode}
          receiver={receiver}
          setReceiver={setReceiver}
          purpose={purpose}
          setPurpose={setPurpose}
          emailText={emailText}
          setEmailText={setEmailText}
          canGenerate={canGenerateForm}
          onGenerate={handleGenerate}
          tooltipSlot={tooltipSlot}
          onChipSelect={onChipSelect}
          showCorrectionHint={showCorrectionHint}
          onDismissCorrectionHint={() => {
            setShowCorrectionHint(false);
            localStorage.setItem(CORRECTION_HINT_KEY, "true");
          }}
          onModeChange={handleModeChange}
          mode={mode}
        />
      )}

      {/* 토스트 */}
      {toastMessage && (
        <div
          className="w-[calc(100%-32px)] absolute bottom-[78px] left-1/2 -translate-x-1/2 bg-background-inverse flex items-center gap-2 px-3 py-2.5 rounded-lg pointer-events-none z-50"
          style={{ boxShadow: "0px 8px 24px -2px rgba(124,77,255,0.16)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9.99935 18.3333C14.6018 18.3333 18.3327 14.6025 18.3327 9.99996C18.3327 5.39746 14.6018 1.66663 9.99935 1.66663C5.39685 1.66663 1.66602 5.39746 1.66602 9.99996C1.66602 14.6025 5.39685 18.3333 9.99935 18.3333Z" fill="#7C4DFF" />
            <path d="M7.5 10L9.16667 11.6667L12.5 8.33337" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-text-inverse text-xs font-semibold leading-4 tracking-tight">
            {toastMessage}
          </p>
        </div>
      )}
    </>
  );
};

export default ToneFitPanel;
