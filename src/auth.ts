/**
 * ToneFit Extension — 인증 유틸리티
 *
 * 흐름:
 *   1. launchWebAuthFlow → Google ID 토큰(JWT) 발급
 *   2. POST /auth/google { id_token, terms_agreements? }
 *   3. access_token → chrome.storage.local 저장
 */

import axios from 'axios';
import type { GoogleAuthResponse, TermsAgreement } from '@/types';

const STORAGE_KEY = 'tonefit_access_token';
const API_URL = import.meta.env.VITE_API_URL as string;

// ── chrome.storage.local 헬퍼 ─────────────────────────────────────

export const getStoredToken = (): Promise<string | null> =>
  new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve((result[STORAGE_KEY] as string) ?? null);
    });
  });

export const storeToken = (token: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: token }, resolve);
  });

export const clearToken = (): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove([STORAGE_KEY], resolve);
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

        // redirect URL hash에서 id_token 파싱
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

// ── 로그아웃 ─────────────────────────────────────────────────────

export const logout = async (): Promise<void> => {
  const token = await getStoredToken();
  if (token) {
    await axios
      .post(`${API_URL}/auth/logout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(console.error); // 서버 오류여도 로컬 토큰은 삭제
  }
  await clearToken();
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

  await storeToken(responseData.access_token);

  // 팝업에서 사용할 사용자 프로필 + 선택 약관 초기값 저장
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
