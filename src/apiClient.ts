/**
 * ToneFit Extension — API 클라이언트
 *
 * 메인 앱의 apiClient와 별개로 관리.
 * - 토큰을 chrome.storage.local에서 직접 읽어 헤더에 주입
 * - 401 시 silent re-auth (interactive:false launchWebAuthFlow) 후 재시도
 * - silent 발급 실패 시 그대로 throw → 호출자가 로그인 화면으로 이동
 */

import axios from 'axios';

const DEBUG = false;

/** DevTools 패널로 로그 전달 */
const devlog = (level: 'info' | 'error' | 'warn', tag: string, message: string) => {
  chrome.runtime.sendMessage({ type: 'DEVTOOLS_LOG', level, tag, message }).catch(() => {});
};
import {
  getStoredToken,
  storeToken,
  getGoogleIdToken,
  signInWithGoogle,
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

// silent re-auth 중복 호출 방지 — 진행 중인 Promise 재사용
let silentReauthPromise: Promise<string> | null = null;

/**
 * access token 만료 시 silent re-auth
 * interactive:false → 사용자 팝업 없이 Google 세션으로 조용히 갱신
 * 실패 시 throw → 호출자가 session_expired 처리
 */
const silentReauth = (): Promise<string> => {
  if (silentReauthPromise) return silentReauthPromise;

  silentReauthPromise = (async () => {
    try {
      const idToken = await getGoogleIdToken(false); // interactive:false — UI 팝업 없이 시도
      const result = await signInWithGoogle(idToken);
      await storeToken(result.data.access_token);
      devlog('info', 'Auth', 'silentReauth 성공 — 토큰 갱신 완료');
      return result.data.access_token;
    } catch (err) {
      // Google 세션 만료 → 사용자가 직접 로그인해야 함
      console.error('[ToneFit API] silentReauth 실패:', err);
      devlog('error', 'Auth', `silentReauth 실패 — ${String(err)}`);
      throw Object.assign(new Error('SESSION_EXPIRED'), {
        _sessionExpired: true,
      });
    } finally {
      silentReauthPromise = null;
    }
  })();

  return silentReauthPromise;
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

/**
 * 401 응답 시 silent re-auth 후 재시도하는 래퍼
 * fn: 헤더를 받아 실제 요청을 수행하는 함수
 */
const withReauth = async <T>(
  fn: (headers: Record<string, string>) => Promise<T>
): Promise<T> => {
  const headers = await buildHeaders();
  try {
    return await fn(headers);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status !== 401) throw err;

    // silent re-auth 후 재시도
    console.error('[ToneFit API] 401 감지 → silentReauth 시도');
    devlog('warn', 'Auth', '401 감지 → silentReauth 시도');
    const newToken = await silentReauth();
    const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
    return await fn(retryHeaders);
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
  devlog('info', 'Correction', `교정 요청 — receiver: ${data.receiver_type}, purpose: ${data.purpose}`);
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
