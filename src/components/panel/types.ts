import type { ReactNode } from "react";
import type {
  ReceiverType,
  PurposeType,
  CorrectionChange,
  CorrectionsRejectionItem,
} from "@/types";

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
