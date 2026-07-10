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
import type { CorrectionChange, CorrectionsRejectionItem } from "@/types";

import { PanelHeader } from "./PanelHeader";
import GenerateInputBody from "./views/generate/GenerateInputBody";
import GenerateLoadingBody from "./views/generate/GenerateLoadingBody";
import GenerateSuccessBody from "./views/generate/GenerateSuccessBody";
import CorrectReviewBody from "./views/correct/CorrectReviewBody";
import CorrectSuccessBody from "./views/correct/CorrectSuccessBody";
import CorrectNoneBody from "./views/correct/CorrectNoneBody";
import ReplyConsentBody from "./views/reply/ReplyConsentBody";
import ReplyAnalysisLoadingBody from "./views/reply/ReplyAnalysisLoadingBody";
import ReplyWriteLoadingBody from "./views/reply/ReplyWriteLoadingBody";
import ReplyInputBody from "./views/reply/ReplyInputBody";
import ReplySuccessBody from "./views/reply/ReplySuccessBody";
import ErrorBody from "./views/error/ErrorBody";

import {
  RECEIVER_OPTIONS,
  PURPOSE_OPTIONS,
  EMAIL_MAX,
  DEV_MOCK_ORIGINAL,
  DEV_MOCK_REPLY_ANALYSIS,
  DEV_MOCK_REPLY_SUMMARIES,
  DEV_MOCK_CHANGES,
} from "./constants";

import type {
  PanelView,
  PanelMode,
  GenerateResult,
  ToneFitPanelProps,
  ErrorVariant,
  ReplyErrorVariant,
} from "./types";

export type { PanelView, PanelMode, GenerateResult, ErrorVariant, ReplyErrorVariant };
export type { GenerateParams } from "./types";
export type { ToneFitPanelProps } from "./types";
export { PanelHeader } from "./PanelHeader";

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
  const [receiver, setReceiver] = useState<import("@/types").ReceiverType | null>(null);
  const [purpose, setPurpose] = useState<import("@/types").PurposeType | null>(null);
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
  const [replyDraftText, setReplyDraftText] = useState<string>("");

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
      ? !!receiver
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
    if (!canGenerateForm || !receiver) return;
    if (panelMode !== "correct" && !purpose) return;

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
      const status = (err as { response?: { status?: number } })?.response?.status;
      const sessionExpired = (err as { _sessionExpired?: boolean })?._sessionExpired;
      if (status === 401 || sessionExpired) setInternalErrorVariant("session_expired");
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
        setReplyDraftText(result.generated_email);
        setView("reply-success");
      } catch (err) {
        onError?.(err);
        const status = (err as { response?: { status?: number } })?.response?.status;
        const sessionExpired = (err as { _sessionExpired?: boolean })?._sessionExpired;
        if (status === 401 || sessionExpired) {
          setInternalErrorVariant("session_expired");
        } else {
          setInternalErrorVariant("reply_api_error");
        }
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
            _sessionExpired?: boolean;
            response?: { status?: number };
          };
          if (typedErr._termsRequired) {
            setView("reply-consent");
          } else if (typedErr._sessionExpired || typedErr.response?.status === 401) {
            setInternalErrorVariant("session_expired");
            setView("error");
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
        <GenerateLoadingBody
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
          <CorrectSuccessBody
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
          <GenerateSuccessBody
            mode={mode}
            panelMode={activePanelMode}
            draftText={draftText}
            onReset={handleReset}
            showToast={showToast}
          />
        ))}
      {activeView === "error" && (
        <ErrorBody
          key={`${internalErrorVariant ?? errorVariant}-${activePanelMode}`}
          variant={internalErrorVariant ?? errorVariant}
          panelMode={activePanelMode}
          onRetry={handleRetry}
          onGoToLogin={onGoToLogin}
        />
      )}
      {activeView === "no-correction" && (
        <CorrectNoneBody onConfirm={onNoCorrectionConfirm} />
      )}
      {activeView === "correction-review" && (
        <CorrectReviewBody
          changes={correctionSession?.changes ?? DEV_MOCK_CHANGES}
          originalEmail={correctionSession?.originalEmail ?? DEV_MOCK_ORIGINAL}
          receiver={correctionSession?.receiver ?? "DIRECT_SUPERVISOR"}
          purpose={correctionSession?.purpose ?? "REPORT"}
          onComplete={handleCorrectionComplete}
        />
      )}
      {activeView === "reply-consent" && (
        <ReplyConsentBody
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
        <ReplyAnalysisLoadingBody onCancel={onReplyAnalysisCancel} />
      )}
      {activeView === "reply-input" && (
        <ReplyInputBody
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
        <ReplyWriteLoadingBody
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
        <ReplySuccessBody
          draftText={replyDraftText}
          showToast={showToast}
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
        <GenerateInputBody
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
