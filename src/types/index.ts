/**
 * ToneFit 타입 정의
 *
 * API 명세 v0.53 기준으로 작성된 TypeScript 타입 파일입니다.
 * 백엔드 응답/요청 구조를 타입으로 미리 정의해두면
 * 자동완성이 되고, 오타가 나면 빨간 줄이 생겨서 실수를 줄일 수 있어요.
 */

// =============================================================
// Enum 타입
// 백엔드와 약속된 값 목록 — 임의 문자열 사용 금지!
// =============================================================

/** 수신자 유형 */
export type ReceiverType =
  | 'DIRECT_SUPERVISOR' // 상사
  | 'OTHER_DEPT_COLLEAGUE' // 동료
  | 'EXTERNAL_PARTNER' // 협력사
  | 'CLIENT'; // 고객 & 거래처

/** 이메일 목적 */
export type PurposeType =
  | 'REPORT' // 보고
  | 'REQUEST' // 요청
  | 'NOTICE' // 안내
  | 'THANKS' // 감사
  | 'APOLOGY' // 사과
  | 'REPLY' // 회신
  | 'DECLINE'; // 거절

/** 구독 플랜 */
export type PlanType = 'FREE' | 'PRO';

/** 교정 세션 상태 */
export type SessionStatusType =
  | 'IN_PROGRESS' // 교정 완료, 사용자 검토 중
  | 'CONFIRMED'; // 확정 완료 (송신)

/** 교정 피드백 액션 */
export type FeedbackActionType = 'ACCEPTED' | 'REJECTED';

/**
 * 거절 1차 사유
 * MEANING : 의미가 달라졌어요
 * STYLE   : 내 스타일&상황과 안 맞아요
 * OTHER   : 다른 이유가 있어요
 * NONE    : 사유 없음
 */
export type RejectReasonPrimaryType = 'MEANING' | 'STYLE' | 'OTHER' | 'NONE';

/**
 * 거절 2차 사유 (STYLE 선택 시에만 유효)
 * MY_EXPRESSION : 내 평소 표현을 유지하고 싶어요
 * TONE          : 이 상황에 어조가 안 맞아요
 * AWKWARD       : 그냥 어색해요
 */
export type RejectReasonSecondaryType = 'MY_EXPRESSION' | 'TONE' | 'AWKWARD';

/**
 * AI 교정 계층 라벨
 * AUTO    → 필수 교정 (문법 오류, 반드시 수정)
 * SUGGEST → 추천 교정 (더 나은 표현 제안)
 * STYLE   → 참고 (스타일 권고, 선택 사항)
 */
export type CorrectionLabelType = 'AUTO' | 'SUGGEST' | 'STYLE';

/**
 * 약관 종류
 * SERVICE / PRIVACY / ANALYTICS → 필수
 * MARKETING / AI_LEARNING       → 선택
 */
export type TermsType =
  | 'SERVICE'
  | 'PRIVACY'
  | 'ANALYTICS'
  | 'MARKETING'
  | 'AI_LEARNING'
  | 'MAIL_READ'
  | 'OVERSEAS_TRANSFER';

// =============================================================
// 공통 타입
// =============================================================

/** API 공통 에러 응답 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    /** 영향받은 세션 ID — 해당 없으면 null */
    sessionId: number | null;
    /** 케이스별 부가 페이로드 — 해당 없으면 null */
    details: Record<string, unknown> | null;
  };
}

/**
 * 보호 영역 — 교정에서 제외할 원문 구간
 * 사용자가 드래그로 선택한 영역을 원문 기준 offset으로 표현
 */
export interface ProtectedRange {
  start: number; // 시작 offset
  end: number; // 끝 offset
}

// =============================================================
// 익명 세션 (Anonymous Session)
// =============================================================

/**
 * JWT 페이로드 구조
 * 토큰을 decode했을 때 얻는 클레임 정보
 */
export interface TokenPayload {
  /** 유저 ID */
  user_id: number;
  /** 익명 여부 — true: 익명, false: 정식 회원 */
  is_guest: boolean;
  /** 발급 시각 (Unix timestamp) */
  iat: number;
  /** 만료 시각 (Unix timestamp) */
  exp: number;
}

// =============================================================
// 인증 (Auth) — Google OAuth 단일 흐름
// =============================================================

/** 약관 동의 항목 */
export interface TermsAgreement {
  type: TermsType;
  version: string; // 예: '1.0'
  agreed: boolean;
}

/**
 * POST /auth/google 요청
 * 신규 가입 / 기존 로그인 / 게스트 전환 모두 동일 엔드포인트
 */
export interface GoogleAuthRequest {
  /** Google Identity Services SDK가 발급한 JWT ID token */
  id_token: string;
  /**
   * 약관 동의 항목
   * 신규 가입·게스트 전환·기존 사용자 미보유 케이스에서 필수
   * 이미 필수 약관을 보유한 로그인은 무시됨
   */
  terms_agreements?: TermsAgreement[];
}

/** POST /auth/google 응답 (201 신규 / 200 기존·전환) */
export interface GoogleAuthResponse {
  user_id: number;
  email: string;
  nickname: string;
  profile_image_url: string | null;
  provider: 'GOOGLE';
  is_guest: false;
  plan: PlanType;
  credit_balance: number;
  access_token: string;
  refresh_token: string;
}

/** POST /auth/refresh 응답 — RTR: access + refresh 동시 교체 (v0.59) */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// =============================================================
// 사용자 (Users)
// =============================================================

/** GET /users/me 응답 */
export interface UserProfile {
  user_id: number;
  /** 정식 유저만. 익명은 null */
  email: string | null;
  /** 정식 유저만 (Google 프로필 표시 이름). 익명은 null */
  nickname: string | null;
  profile_image_url: string | null;
  /** 정식 유저만. 익명은 null */
  provider: 'GOOGLE' | null;
  is_guest: boolean;
  plan: PlanType;
  credit_balance: number;
  created_at: string; // ISO 8601
  ai_learning_agreed: boolean;
  marketing_agreed: boolean;
}

/** PATCH /users/me/terms/{type} 요청 — 선택 약관 철회·재동의 */
export interface ToggleTermsRequest {
  /** true = 재동의, false = 철회 */
  agreed: boolean;
}

// =============================================================
// 교정 (Corrections)
// =============================================================

/** 교정 개별 항목 */
export interface CorrectionChange {
  index: number; // 0-based 교정 번호
  start: number; // 원문 기준 시작 offset
  end: number; // 원문 기준 끝 offset
  original: string; // 원문 표현
  corrected: string; // 교정된 표현
  reason: string; // 교정 이유 (국립국어원 근거)
  label: CorrectionLabelType; // AUTO | SUGGEST | STYLE
  confidence: number; // 교정 신뢰도 0~1
  applied_rules: string[]; // 적용된 규칙 코드
  action: FeedbackActionType | null; // 사용자 수락/거절 상태
  rejectReason?: string; // 거절 사유 (선택)
}

/** 임시저장(Draft) 요청 — 모든 필드 선택 */
export interface DraftRequest {
  receiver_type?: ReceiverType;
  purpose?: PurposeType;
  subject?: string;
  original_email?: string;
  context?: string;
}

/** 임시저장 응답 */
export interface DraftResponse {
  session_id: number;
  status: 'DRAFT';
  updated_at: string;
}

/** 임시저장 조회 응답 */
export interface DraftDetailResponse {
  session_id: number;
  receiver_type: ReceiverType;
  purpose: PurposeType;
  subject: string;
  original_email: string;
  context: string;
  updated_at: string;
}

/** POST /corrections 요청 */
export interface CorrectionRequest {
  receiver_type: ReceiverType;
  original_email: string; // 10자 이상, 2000자 이하
  protected_ranges?: ProtectedRange[];
}

/** POST /corrections 응답 (201) */
export interface CorrectionResponse {
  session_id: number;
  changes: CorrectionChange[];
}

/** POST /corrections/rejections 요청 — 거절 항목 보존 */
export interface CorrectionsRejectionItem {
  label: CorrectionLabelType;
  original_phrase: string;
  corrected_phrase: string;
  meaning_damage_suspected?: boolean | null;
}

export interface CorrectionsRejectionsRequest {
  receiver_type: ReceiverType;
  purpose: PurposeType;
  items: CorrectionsRejectionItem[];
}

export interface CorrectionsRejectionsResponse {
  stored: number;
}

/**
 * POST /corrections/{session_id}/reject 요청
 * 특정 교정 건을 거부하고 사유를 함께 기록합니다.
 */
export interface RejectRequest {
  /** 거부 대상 교정 건의 index (0-based) */
  index: number;
  /** 1차 거절 사유 */
  reason_primary?: RejectReasonPrimaryType;
  /** 2차 거절 사유 (STYLE일 때만 유효) */
  reason_secondary?: RejectReasonSecondaryType;
  /** 자유 입력 사유 (OTHER일 때만 유효, 200자 이내) */
  reason_text?: string | null;
}

/** POST /corrections/{session_id}/reject 응답 */
export interface RejectResponse {
  session_id: number;
  index: number;
  action: 'REJECTED';
  updated_at: string;
}

/**
 * POST /corrections/{session_id}/confirm 요청
 * 사용자가 실제로 송신하는 시점에 호출. 미처리 changes는 자동 ACCEPTED.
 */
export interface ConfirmRequest {
  /** 사용자가 실제로 송신한 최종 본문. 최대 4,000자 */
  user_final: string;
}

/** POST /corrections/{session_id}/confirm 응답 */
export interface ConfirmResponse {
  session_id: number;
  status: 'CONFIRMED';
  updated_at: string;
}

// =============================================================
// 생성 (Generations)
// =============================================================

/** POST /generations 요청 */
export interface GenerationRequest {
  receiver_type: ReceiverType;
  purpose: PurposeType;
  /** 작성할 내용의 간략 요지. 10자 이상, 200자 이하 */
  brief_content: string;
}

/**
 * POST /generations 응답 (201)
 * 저장 없음 — 히스토리에 노출되지 않는 일회성 결과
 */
export interface GenerationResponse {
  generated_subject: string;
  generated_email: string;
}

// =============================================================
// 교정 이력 (History)
// =============================================================

/** 세션 목록 아이템 */
export interface SessionSummary {
  session_id: number;
  receiver_type: ReceiverType;
  purpose: PurposeType;
  status: SessionStatusType;
  original_preview: string; // 원문 앞 50자
  created_at: string;
}

/** GET /corrections/in-progress 응답 */
export interface InProgressSessionsResponse {
  sessions: SessionSummary[];
}

/** GET /corrections/history 응답 */
export interface HistoryResponse {
  total: number;
  page: number;
  size: number;
  sessions: SessionSummary[];
}

/** GET /corrections/history 쿼리 파라미터 */
export interface HistoryParams {
  page?: number;
  size?: number;
  receiver_type?: ReceiverType;
  purpose?: PurposeType;
}

/** 이력 상세 — 교정 항목 (v0.53 기준) */
export interface FeedbackDetail {
  index: number;
  start: number;
  end: number;
  original: string;
  corrected: string;
  reason: string;
  label: CorrectionLabelType;
  confidence: number;
  applied_rules: string[];
  action: FeedbackActionType;
  reason_primary: RejectReasonPrimaryType | null;
  reason_secondary: RejectReasonSecondaryType | null;
  reason_text: string | null;
}

/** GET /corrections/{session_id} 응답 */
export interface SessionDetailResponse {
  session_id: number;
  receiver_type: ReceiverType;
  purpose: PurposeType;
  original_email: string;
  /** 사용자가 송신한 최종본 — CONFIRMED 상태만 */
  user_final: string | null;
  status: SessionStatusType;
  feedbacks: FeedbackDetail[];
  created_at: string;
  updated_at: string;
}

// =============================================================
// 회신 (Replies)
// =============================================================

export interface ReplyMail {
  sender: string;
  body: string;
}

export interface ReplyAnalysisRequest {
  mails: ReplyMail[];
  to?: string[];
  cc?: string[];
}

export interface ReplyQuestion {
  id: number;
  question: string;
  mail_order?: number;
}

export interface ReplySummaryResponse {
  summary_lines: string[];
}

export interface ReplyAnalysisResponse {
  conversation: string;
  recipient: {
    type: ReceiverType;
    label: string;
    confidence: 'high' | 'mid' | 'low';
    reason: string;
  };
  questions: ReplyQuestion[];
}

export interface ReplyAnswer {
  question_id: number;
  answer: string;
}

export interface ReplyRequest {
  conversation: string;
  summary_lines?: string[];
  receiver_type: ReceiverType;
  original_subject?: string;
  questions?: ReplyQuestion[];
  answers?: ReplyAnswer[];
  free_input?: string;
  extra_message?: string;
}

export interface ReplyResponse {
  generated_subject: string;
  generated_email: string;
}
