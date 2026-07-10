/**
 * ToneFit Extension — 인증 유틸리티
 *
 * 흐름:
 *   1. launchWebAuthFlow → Google ID 토큰(JWT) 발급
 *   2. POST /auth/google { id_token, terms_agreements? }
 *   3. access_token + refresh_token → chrome.storage.local 저장
 *   4. access 만료 시 POST /auth/refresh (RTR — single-flight는 apiClient에서 보장)
 */

import axios from 'axios';
import type { GoogleAuthResponse, RefreshResponse, TermsAgreement } from '@/types';

const ACCESS_TOKEN_KEY = 'tonefit_access_token';
const REFRESH_TOKEN_KEY = 'tonefit_refresh_token';
const API_URL = import.meta.env.VITE_API_URL as string;

// ── chrome.storage.local 헬퍼 ─────────────────────────────────────

export const getStoredToken = (): Promise<string | null> =>
  new Promise((resolve) => {
    chrome.storage.local.get([ACCESS_TOKEN_KEY], (result) => {
      resolve((result[ACCESS_TOKEN_KEY] as string) ?? null);
    });
  });

export const storeToken = (token: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [ACCESS_TOKEN_KEY]: token }, resolve);
  });

export const clearToken = (): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove([ACCESS_TOKEN_KEY], resolve);
  });

export const getStoredRefreshToken = (): Promise<string | null> =>
  new Promise((resolve) => {
    chrome.storage.local.get([REFRESH_TOKEN_KEY], (result) => {
      resolve((result[REFRESH_TOKEN_KEY] as string) ?? null);
    });
  });

export const storeRefreshToken = (token: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [REFRESH_TOKEN_KEY]: token }, resolve);
  });

export const clearRefreshToken = (): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove([REFRESH_TOKEN_KEY], resolve);
  });

// ── Google ID 토큰 발급 ───────────────────────────────────────────

/**
 * launchWebAuthFlow로 Google OpenID Connect ID 토큰 발급
 * - response_type=id_token → redirect hash에서 추출
 */
export const getGoogleIdToken = (interactive = true): Promise<string> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    if (!clientId) {
      reject(new Error('VITE_GOOGLE_CLIENT_ID 환경변수가 없습니다'));
      return;
    }

    const redirectUri = chrome.identity.getRedirectURL();
    const nonce = crypto.randomUUID();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', nonce);

    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(
            new Error(chrome.runtime.lastError?.message ?? 'Google 로그인 실패')
          );
          return;
        }

        const hash = new URL(redirectUrl).hash.slice(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');

        if (!idToken) {
          reject(new Error('Google ID 토큰을 가져올 수 없습니다'));
          return;
        }

        resolve(idToken);
      }
    );
  });
};

// ── access token 갱신 (RTR) ───────────────────────────────────────

/**
 * POST /auth/refresh — RTR 회전 갱신
 * 새 access + refresh 를 받아 모두 교체 저장.
 * 재사용·무효 시 401 INVALID_TOKEN → 호출자가 interactive 재로그인으로 처리.
 * single-flight 직렬화는 apiClient.ts 의 refreshPromise 에서 보장.
 */
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw Object.assign(new Error('INVALID_TOKEN'), { _sessionExpired: true });
  }

  const response = await axios.post<{ success: boolean; data: RefreshResponse }>(
    `${API_URL}/auth/refresh`,
    { refresh_token: refreshToken }
  );

  const data =
    response.data?.success !== undefined
      ? response.data.data
      : (response.data as unknown as RefreshResponse);

  await Promise.all([storeToken(data.access_token), storeRefreshToken(data.refresh_token)]);
  return data.access_token;
};

// ── 로그아웃 ─────────────────────────────────────────────────────

export const logout = async (): Promise<void> => {
  const refreshToken = await getStoredRefreshToken();
  if (refreshToken) {
    await axios
      .post(`${API_URL}/auth/logout`, { refresh_token: refreshToken })
      .catch(console.error); // 서버 오류여도 로컬 토큰은 폐기
  }
  await Promise.all([clearToken(), clearRefreshToken()]);
};

// ── ToneFit 백엔드 인증 ───────────────────────────────────────────

export interface SignInResult {
  data: GoogleAuthResponse;
  /** HTTP 201 → 신규 가입, 200 → 기존 회원 */
  isNewUser: boolean;
}

/**
 * Google ID 토큰으로 ToneFit 로그인/가입
 * @param idToken  getGoogleIdToken()으로 발급받은 JWT
 * @param termsAgreements  신규 가입 시 약관 동의 항목
 */
export const signInWithGoogle = async (
  idToken: string,
  termsAgreements?: TermsAgreement[]
): Promise<SignInResult> => {
  const body: { id_token: string; terms_agreements?: TermsAgreement[] } = {
    id_token: idToken,
  };
  if (termsAgreements) {
    body.terms_agreements = termsAgreements;
  }

  const response = await axios.post<{
    success: boolean;
    data: GoogleAuthResponse;
  }>(`${API_URL}/auth/google`, body);

  const responseData =
    response.data?.success !== undefined
      ? response.data.data
      : (response.data as unknown as GoogleAuthResponse);

  await Promise.all([
    storeToken(responseData.access_token),
    storeRefreshToken(responseData.refresh_token),
  ]);

  const aiConsent =
    termsAgreements?.find((t) => t.type === 'AI_LEARNING')?.agreed ?? false;
  const marketingConsent =
    termsAgreements?.find((t) => t.type === 'MARKETING')?.agreed ?? false;
  chrome.storage.local.set({
    tonefit_user_profile: {
      name: responseData.nickname,
      email: responseData.email,
      picture: responseData.profile_image_url ?? null,
    },
    tonefit_ai_consent: aiConsent,
    tonefit_marketing_consent: marketingConsent,
  });

  return {
    data: responseData,
    isNewUser: response.status === 201,
  };
};
