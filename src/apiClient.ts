/**
 * ToneFit Extension — API 클라이언트
 *
 * 메인 앱의 apiClient와 별개로 관리.
 * - 토큰을 chrome.storage.local에서 직접 읽어 헤더에 주입
 * - 401 UNAUTHORIZED → POST /auth/refresh (RTR) 후 1회 재시도
 * - 401 INVALID_TOKEN (refresh 무효·재사용) → SESSION_EXPIRED throw → interactive 재로그인
 * - single-flight: 동시 갱신 요청은 진행 중인 Promise 재사용 (RTR 재사용 판정 방지)
 */

import axios from 'axios';

const DEBUG = false;

/** DevTools 패널로 로그 전달 */
const devlog = (level: 'info' | 'error' | 'warn', tag: string, message: string) => {
  chrome.runtime.sendMessage({ type: 'DEVTOOLS_LOG', level, tag, message }).catch(() => {});
};
import {
  getStoredToken,
  refreshAccessToken,
} from '@ext/auth';
import type {
  GenerationRequest,
  GenerationResponse,
  CorrectionRequest,
  CorrectionResponse,
  CorrectionsRejectionsRequest,
  CorrectionsRejectionsResponse,
  TermsType,
  UserProfile,
  ReplyAnalysisRequest,
  ReplyAnalysisResponse,
  ReplySummaryResponse,
  ReplyRequest,
  ReplyResponse,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL as string;

// single-flight: 동시 갱신 요청이 들어와도 하나의 Promise만 실행 (RTR 재사용 판정 방지)
let refreshPromise: Promise<string> | null = null;

const silentRefresh = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;
  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

/** auth 헤더 포함한 기본 헤더 반환 */
const buildHeaders = async (): Promise<Record<string, string>> => {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.error('[ToneFit API] 저장된 토큰 없음 — 비인증 요청으로 진행');
    devlog('warn', 'Auth', '저장된 토큰 없음 — 비인증 요청');
  }
  return headers;
};

const getErrorCode = (err: unknown): string | undefined =>
  (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;

/**
 * 401 UNAUTHORIZED → refresh 후 1회 재시도
 * 401 INVALID_TOKEN (refresh 무효·재사용) → SESSION_EXPIRED throw
 */
const withReauth = async <T>(
  fn: (headers: Record<string, string>) => Promise<T>
): Promise<T> => {
  const headers = await buildHeaders();
  try {
    return await fn(headers);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 401) throw err;

    const code = getErrorCode(err);

    // refresh 토큰 자체가 무효 → 재로그인 필요
    if (code === 'INVALID_TOKEN') {
      console.error('[ToneFit API] INVALID_TOKEN → 재로그인 필요');
      devlog('warn', 'Auth', 'INVALID_TOKEN → 재로그인 필요');
      throw Object.assign(new Error('SESSION_EXPIRED'), { _sessionExpired: true });
    }

    // access 만료 → refresh로 갱신 후 재시도
    try {
      console.error('[ToneFit API] 401 감지 → refresh 시도');
      devlog('info', 'Auth', '401 감지 → refresh 시도');
      const newToken = await silentRefresh();
      return await fn({ ...headers, Authorization: `Bearer ${newToken}` });
    } catch (refreshErr) {
      console.error('[ToneFit API] refresh 실패 → 재로그인 필요');
      devlog('warn', 'Auth', 'refresh 실패 → 재로그인 필요');
      throw Object.assign(new Error('SESSION_EXPIRED'), { _sessionExpired: true });
    }
  }
};

/** API 응답 { success, data } 래퍼 unwrap */
const unwrap = <T>(data: unknown): T => {
  if (
    data !== null &&
    typeof data === 'object' &&
    'success' in data &&
    'data' in data
  ) {
    return (data as { data: T }).data;
  }
  return data as T;
};

// =============================================================
// API 함수
// =============================================================

/** 내 정보 조회 */
export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await withReauth((headers) =>
    axios.get<unknown>(`${API_URL}/users/me`, { headers })
  );
  return unwrap<UserProfile>(response.data);
};

/** 선택 약관 토글 (MARKETING / AI_LEARNING) */
export const toggleTerms = async (
  type: TermsType,
  agreed: boolean
): Promise<void> => {
  await withReauth((headers) =>
    axios.patch(`${API_URL}/users/me/terms/${type}`, { agreed }, { headers })
  );
};

/** 이메일 교정 */
export const postCorrection = async (
  data: CorrectionRequest
): Promise<CorrectionResponse> => {
  devlog('info', 'Correction', `교정 요청 — receiver: ${data.receiver_type}`);
  try {
    const response = await withReauth((headers) =>
      axios.post<unknown>(`${API_URL}/corrections`, data, {
        headers,
        timeout: 60000,
      })
    );
    const result = unwrap<CorrectionResponse>(response.data);
    devlog('info', 'Correction', `교정 응답 ${response.status} — session: ${result.session_id ?? '?'}`);
    return result;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    devlog('error', 'Correction', `교정 실패 — status: ${status ?? 'network'}`);
    throw err;
  }
};

/** 거절 항목 보존 */
export const postCorrectionsRejections = async (
  data: CorrectionsRejectionsRequest
): Promise<CorrectionsRejectionsResponse> => {
  const response = await withReauth((headers) =>
    axios.post<unknown>(`${API_URL}/corrections/rejections`, data, { headers })
  );
  return unwrap<CorrectionsRejectionsResponse>(response.data);
};

/** 약관 동의/철회 */
export const patchTermsAgreement = async (
  type: TermsType,
  agreed: boolean
): Promise<void> => {
  await withReauth((headers) =>
    axios.patch<unknown>(
      `${API_URL}/users/me/terms/${type}`,
      { agreed },
      { headers }
    )
  );
};

/** 회신 요약 */
export const postReplySummary = async (
  data: ReplyAnalysisRequest,
  signal?: AbortSignal
): Promise<ReplySummaryResponse> => {
  devlog('info', 'Reply/Summary', '요약 요청');
  try {
    const response = await withReauth((headers) =>
      axios.post<unknown>(`${API_URL}/replies/summary`, data, { headers, timeout: 60000, signal })
    );
    devlog('info', 'Reply/Summary', `요약 응답 ${response.status}`);
    return unwrap<ReplySummaryResponse>(response.data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    devlog('error', 'Reply/Summary', `요약 실패 — status: ${status ?? 'network'}`);
    throw err;
  }
};

/** 회신 파악 */
export const postReplyAnalysis = async (
  data: ReplyAnalysisRequest,
  signal?: AbortSignal
): Promise<ReplyAnalysisResponse> => {
  devlog('info', 'Reply/Analysis', '분석 요청');
  try {
    const response = await withReauth((headers) =>
      axios.post<unknown>(`${API_URL}/replies/analysis`, data, { headers, timeout: 60000, signal })
    );
    devlog('info', 'Reply/Analysis', `분석 응답 ${response.status}`);
    return unwrap<ReplyAnalysisResponse>(response.data);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    devlog('error', 'Reply/Analysis', `분석 실패 — status: ${status ?? 'network'}`);
    throw err;
  }
};

/** 회신 작성 */
export const postReply = async (data: ReplyRequest): Promise<ReplyResponse> => {
  devlog('info', 'Reply', `회신 요청 — receiver: ${data.receiver_type}`);
  try {
    const response = await withReauth((headers) =>
      axios.post<unknown>(`${API_URL}/replies`, data, {
        headers,
        timeout: 60000,
      })
    );
    const result = unwrap<ReplyResponse>(response.data);
    devlog('info', 'Reply', `회신 응답 ${response.status}`);
    return result;
  } catch (err) {
    const e = err as { response?: { status?: number; data?: unknown } };
    const status = e?.response?.status;
    console.error('[ToneFit] postReply 에러 — status:', status, 'body:', JSON.stringify(e?.response?.data));
    devlog('error', 'Reply', `회신 실패 — status: ${status ?? 'network'}, body: ${JSON.stringify(e?.response?.data)}`);
    throw err;
  }
};

/** 이메일 생성 */
export const postGeneration = async (
  data: GenerationRequest
): Promise<GenerationResponse> => {
  devlog('info', 'Generation', `생성 요청 — receiver: ${data.receiver_type}, purpose: ${data.purpose}`);
  try {
    const response = await withReauth((headers) =>
      axios.post<unknown>(`${API_URL}/generations`, data, {
        headers,
        timeout: 60000,
      })
    );
    const result = unwrap<GenerationResponse>(response.data);
    devlog('info', 'Generation', `생성 응답 ${response.status}`);
    return result;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    devlog('error', 'Generation', `생성 실패 — status: ${status ?? 'network'}`);
    throw err;
  }
};
