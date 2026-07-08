import { useState, useEffect } from "react";
import { ButtonLongV2 } from "@/components/ui";
import { ErrorNoticeIcon, LoginExpiredIcon } from "@/components/ui/MotionIcons";
import type { ErrorVariant, ReplyErrorVariant, PanelMode } from "../../types";

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
const ErrorBody = ({
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

export default ErrorBody;
