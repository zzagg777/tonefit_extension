/**
 * Panel — Extension Side Panel 루트 컴포넌트
 *
 * 화면 흐름:
 *   start  → Google 로그인 버튼 (미인증)
 *   terms  → 약관 동의 (신규 가입 시)
 *   main   → ToneFitPanel (인증 완료)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ToneFitPanel } from '@/components/panel';
import type {
  GenerateParams,
  GenerateResult,
  PanelView,
  ErrorVariant,
} from '@/components/panel';
import {
  postGeneration,
  postCorrection,
  postCorrectionsRejections,
  postReplyAnalysis,
  postReplySummary,
  postReply,
  patchTermsAgreement,
  getMyProfile,
} from '@ext/apiClient';
import type {
  TermsType,
  CorrectionsRejectionItem,
  ReceiverType,
  PurposeType,
  ReplyMail,
  ReplyRequest,
} from '@/types';
import StartView from './views/StartView';
import TermsView from './views/TermsView';
import Tooltip from './components/Tooltip';
import {
  getStoredToken,
  clearToken,
  getGoogleIdToken,
  signInWithGoogle,
} from '@ext/auth';
import { setDevLogging, devLog } from '@/utils/devLogger';

type Screen = 'start' | 'terms' | 'main';

// ── DEV 툴바 ─────────────────────────────────────────────────────────

const SCREENS: Screen[] = ['start', 'terms', 'main'];

type DevViewItem = {
  label: string;
  view: PanelView;
  mode: 'generate' | 'correct' | 'reply';
};
const VIEW_GROUPS: { label: string; views: DevViewItem[] }[] = [
  {
    label: '생성하기',
    views: [
      { label: 'input', view: 'input', mode: 'generate' },
      { label: 'load', view: 'loading', mode: 'generate' },
      { label: 'done', view: 'success', mode: 'generate' },
      { label: 'err', view: 'error', mode: 'generate' },
    ],
  },
  {
    label: '교정하기',
    views: [
      { label: 'input', view: 'input', mode: 'correct' },
      { label: 'review', view: 'correction-review', mode: 'correct' },
      { label: 'no-item', view: 'no-correction', mode: 'correct' },
      { label: 'load', view: 'loading', mode: 'correct' },
      { label: 'done', view: 'success', mode: 'correct' },
      { label: 'err', view: 'error', mode: 'correct' },
    ],
  },
  {
    label: '회신하기',
    views: [
      { label: 'call', view: 'reply-loading-analysis', mode: 'reply' },
      { label: 'consent', view: 'reply-consent', mode: 'reply' },
      { label: 'input', view: 'reply-input', mode: 'reply' },
      { label: 'load', view: 'reply-loading-write', mode: 'reply' },
      { label: 'done', view: 'reply-success', mode: 'reply' },
      { label: 'err', view: 'error', mode: 'reply' },
    ],
  },
];
const GENERATE_ERROR_VARIANTS: ErrorVariant[] = [
  'generic',
  'session_expired',
  'rate_limited',
];
const CORRECT_ERROR_VARIANTS: ErrorVariant[] = [
  'generic',
  'session_expired',
  'rate_limited',
];
const REPLY_ERROR_VARIANTS_DEV: ErrorVariant[] = [
  'session_expired',
  'reply_empty',
  'reply_no_quote',
  'reply_too_long',
  'reply_non_korean',
  'reply_api_error',
  'reply_extract_error',
];
const ERROR_VARIANTS_BY_MODE: Record<
  'generate' | 'correct' | 'reply',
  ErrorVariant[]
> = {
  generate: GENERATE_ERROR_VARIANTS,
  correct: CORRECT_ERROR_VARIANTS,
  reply: REPLY_ERROR_VARIANTS_DEV,
};
const ERROR_VARIANT_LABELS: Record<ErrorVariant, string> = {
  generic: 'generic',
  session_expired: 'session',
  rate_limited: 'rate',
  reply_empty: 'empty',
  reply_no_quote: 'no-quote',
  reply_too_long: 'too-long',
  reply_non_korean: 'non-ko',
  reply_api_error: 'api-err',
  reply_extract_error: 'extract-err',
};

const DevToolbar = ({
  screen,
  onScreenChange,
  devView,
  onViewChange,
  errorVariant,
  onErrorVariantChange,
  devPanelMode,
  onPanelModeChange,
  devModeActive,
  onDevModeToggle,
  onMockInject,
}: {
  screen: Screen;
  onScreenChange: (s: Screen) => void;
  devView: PanelView | undefined;
  onViewChange: (v: PanelView | undefined) => void;
  errorVariant: ErrorVariant;
  onErrorVariantChange: (v: ErrorVariant) => void;
  devPanelMode: 'generate' | 'correct' | 'reply' | undefined;
  onPanelModeChange: (m: 'generate' | 'correct' | 'reply' | undefined) => void;
  devModeActive: boolean;
  onDevModeToggle: () => void;
  onMockInject: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const isErrorView = devView === 'error';

  return (
    <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5">
      {open && (
        <div className="bg-background-inverse/90 backdrop-blur-sm rounded-xl px-3 py-2.5 flex flex-col gap-2.5 shadow-lg min-w-48">
          {/* 화면 전환 */}
          <div className="flex flex-col gap-1">
            <p className="text-2xs text-text-inverse/50 font-medium uppercase tracking-wide">
              Screen
            </p>
            <div className="flex gap-1">
              {SCREENS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onScreenChange(s)}
                  className={`flex-1 text-2xs rounded px-1.5 py-1 transition-colors cursor-pointer ${
                    screen === s
                      ? 'bg-background-brand text-text-inverse'
                      : 'bg-background-inverse/30 text-text-inverse/70 hover:bg-background-inverse/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 뷰 강제 전환 (main 화면에서만) */}
          {screen === 'main' && (
            <div className="flex flex-col gap-2">
              {VIEW_GROUPS.map((group) => (
                <div key={group.label} className="flex flex-col gap-1">
                  <p className="text-2xs text-text-inverse/50 font-medium uppercase tracking-wide">
                    {group.label}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {group.views.map((item) => {
                      const isActive =
                        devView === item.view && devPanelMode === item.mode;
                      return (
                        <button
                          key={`${item.mode}-${item.view}`}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              onViewChange(undefined);
                              onPanelModeChange(undefined);
                            } else {
                              onViewChange(item.view);
                              onPanelModeChange(item.mode);
                            }
                          }}
                          className={`text-2xs rounded px-1.5 py-1 transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-background-brand text-text-inverse'
                              : 'bg-background-inverse/30 text-text-inverse/70 hover:bg-background-inverse/50'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 에러 variant 전환 (error 뷰일 때만) */}
          {screen === 'main' && isErrorView && (
            <div className="flex flex-col gap-1">
              <p className="text-2xs text-text-inverse/50 font-medium uppercase tracking-wide">
                Error
              </p>
              <div className="flex gap-1 flex-wrap">
                {ERROR_VARIANTS_BY_MODE[devPanelMode ?? 'generate'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onErrorVariantChange(v)}
                    className={`flex-1 text-2xs rounded px-1.5 py-1 transition-colors cursor-pointer ${
                      errorVariant === v
                        ? 'bg-background-danger-subtle text-text-danger'
                        : 'bg-background-inverse/30 text-text-inverse/70 hover:bg-background-inverse/50'
                    }`}
                  >
                    {ERROR_VARIANT_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mock 교정 주입 테스트 */}
          <div className="flex flex-col gap-1">
            <p className="text-2xs text-text-inverse/50 font-medium uppercase tracking-wide">
              Inject Test
            </p>
            <button
              type="button"
              onClick={onMockInject}
              className="text-2xs rounded px-1.5 py-1 transition-colors cursor-pointer bg-background-warning-subtle text-text-warning hover:opacity-80"
            >
              📨 Mock 교정 주입
            </button>
          </div>
        </div>
      )}

      {/* 하단 버튼 행: DEV 열기/닫기 + ON/OFF 토글 */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="text-2xs bg-background-inverse/80 hover:bg-background-inverse text-text-inverse rounded-full px-3 py-1 transition-colors cursor-pointer shadow"
        >
          {open ? '✕ DEV' : '🛠 DEV'}
        </button>
        <button
          type="button"
          onClick={onDevModeToggle}
          className={`text-2xs rounded-full px-2.5 py-1 transition-colors cursor-pointer shadow font-semibold ${
            devModeActive
              ? 'bg-background-brand text-text-inverse'
              : 'bg-background-inverse/40 text-text-inverse/60 hover:bg-background-inverse/60'
          }`}
        >
          {devModeActive ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};

// ── DEV 전용 기능 노출 여부 — 배포 전 false로 변경 ──────────────────
const SHOW_DEV_TOOLBAR = false;

// 약관 버전 — 서버와 맞춰야 함
const TERMS_VERSION = '1.0';

const Panel = () => {
  const [screen, setScreen] = useState<Screen>('start');
  const [devView, setDevView] = useState<PanelView | undefined>(undefined);
  const [devPanelMode, setDevPanelMode] = useState<
    'generate' | 'correct' | 'reply' | undefined
  >(undefined);
  const [devModeActive, setDevModeActive] = useState(false);
  const [initialPanelMode, setInitialPanelMode] = useState<
    'generate' | 'correct' | 'reply'
  >('generate');
  const [requestedPanelMode, setRequestedPanelMode] = useState<
    'generate' | 'correct' | undefined
  >(undefined);
  // 익스텐션은 무제한 — Infinity로 설정해 소진 로직 비활성화
  const [remainingCount] = useState(Infinity);
  const [errorVariant, setErrorVariant] = useState<ErrorVariant>('generic');

  // 레이트리밋: 1분 내 최대 5회
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // 약관 동의 전까지 id_token을 임시 보관
  const pendingIdTokenRef = useRef<string | null>(null);

  // 현재 활성 Gmail 탭 ID — 메시지 전송 대상 특정용
  const activeTabIdRef = useRef<number | null>(null);

  // 회신 분석 요청 취소용 AbortController
  const replyAbortControllerRef = useRef<AbortController | null>(null);

  // 현재 탭이 Gmail인지 여부 — 오버레이 표시용
  const [isGmailTab, setIsGmailTab] = useState<boolean>(true);

  // 회신 모드 진입 시 background에서 전달된 메일 데이터 (state → re-render 유발)
  const [_requestedReplyData, setRequestedReplyData] = useState<{
    mails: ReplyMail[];
    to?: string[];
    cc?: string[];
  } | null>(null);
  const [replyTriggerKey, setReplyTriggerKey] = useState(0);
  const [panelResetKey, setPanelResetKey] = useState(0);
  const [replyData, setReplyData] = useState<{
    mails: ReplyMail[];
    to?: string[];
    cc?: string[];
    subject?: string;
    replyError?: string;
  } | null>(null);

  // ── 앱 초기화: 저장된 토큰 확인 + 활성 탭 ID 저장 ──────────────

  // 탭 변경 시 Gmail 여부 감지
  useEffect(() => {
    const checkGmail = (tabId?: number) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url ?? '';
        const gmail = url.startsWith('https://mail.google.com');
        setIsGmailTab(gmail);
        if (gmail && tabId !== undefined) activeTabIdRef.current = tabId;
      });
    };

    const onActivated = (info: chrome.tabs.TabActiveInfo) =>
      checkGmail(info.tabId);
    const onUpdated = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (changeInfo.status === 'complete') checkGmail(tabId);
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const url = tabs[0]?.url ?? '';
        setIsGmailTab(url.startsWith('https://mail.google.com'));
        const tabId = tabs[0]?.id ?? null;
        activeTabIdRef.current = tabId;

        if (tabId) {
          chrome.tabs.sendMessage(tabId, { type: 'PANEL_OPENED' });
          chrome.tabs
            .sendMessage(tabId, {
              type: 'DEV_LOGGING',
              enabled: SHOW_DEV_TOOLBAR,
            })
            .catch(() => {});
          // 포트 연결 — disconnect 시 background가 PANEL_CLOSED를 content script로 전달
          const port = chrome.runtime.connect({ name: 'panel' });
          port.postMessage({ type: 'PANEL_REGISTER', tabId });
        }

        // GET_REPLY_DATA를 먼저 기다린 뒤 나머지 초기화 진행
        chrome.runtime.sendMessage(
          { type: 'GET_REPLY_DATA' },
          (resp: {
            data: {
              mails: ReplyMail[];
              to?: string[];
              cc?: string[];
              subject?: string;
              replyError?: string;
            } | null;
          }) => {
            const replyPayload = resp?.data ?? null;
            if (replyPayload) setReplyData(replyPayload);

            getStoredToken()
              .then(async (token) => {
                if (!token) return;
                // 토큰 유효성 검증 — 401(만료)일 때만 토큰 삭제 후 로그인 화면으로
                // 네트워크 오류·CORS 등 일시적 오류는 토큰 유지 후 메인 화면 진행
                try {
                  await getMyProfile();
                } catch (err) {
                  const status = (err as { response?: { status?: number } })
                    ?.response?.status;
                  if (status === 401) {
                    await clearToken();
                    setIsLoading(false);
                    return;
                  }
                  // 401 외 오류(네트워크·CORS 등)는 토큰 유지하고 계속 진행
                }
                chrome.storage.local.get('tonefit_open_source', (result) => {
                  const isToolbarOpen = result['tonefit_open_source'] === 'toolbar';
                  if (isToolbarOpen) {
                    chrome.storage.local.remove('tonefit_open_source');
                  }

                  if (isToolbarOpen || !tabId) {
                    // 툴바 클릭으로 열린 경우 — 작성창 글자수 무시, 생성하기 고정
                    setInitialPanelMode('generate');
                    setScreen('main');
                    return;
                  }

                  chrome.tabs.sendMessage(
                    tabId,
                    { type: 'GET_EMAIL_CONTENT' },
                    (response) => {
                      if (!chrome.runtime.lastError) {
                        const userLength =
                          response?.userLength ??
                          (response?.content ?? '').trim().length;
                        devLog(
                          '[ToneFit] 사용자 입력 글자수(서명 제외):',
                          userLength
                        );
                        if (replyPayload) {
                          setInitialPanelMode('reply');
                        } else {
                          setInitialPanelMode(
                            userLength >= 40 ? 'correct' : 'generate'
                          );
                        }
                      } else {
                        console.error(
                          '[ToneFit] GET_EMAIL_CONTENT 실패:',
                          chrome.runtime.lastError.message
                        );
                      }
                      setScreen('main');
                    }
                  );
                });
              })
              .catch(console.error)
              .finally(() => setIsLoading(false));
          }
        );
      })
      .catch(() => setIsLoading(false));
  }, []);

  // ── DEV 로깅 — 패널 번들(Panel + ToneFitPanel) 항상 ON ──────────
  useEffect(() => {
    setDevLogging(SHOW_DEV_TOOLBAR);
  }, []);

  // ── 팝업에서 로그아웃 시 start 화면으로 이동 / 툴바 재클릭 모드 힌트 ──
  useEffect(() => {
    const handleMessage = (message: { type: string; bodyLength?: number }) => {
      if (message.type === 'LOGOUT') {
        setScreen('start');
      }
      if (message.type === 'MODE_HINT' && message.bodyLength !== undefined) {
        const mode = message.bodyLength >= 40 ? 'correct' : 'generate';
        devLog(
          '[ToneFit] MODE_HINT 수신 — bodyLength:',
          message.bodyLength,
          '→ mode:',
          mode
        );
        setInitialPanelMode(mode);
        setRequestedPanelMode(undefined);
        setPanelResetKey((k) => k + 1);
      }
      // 패널이 이미 열린 상태에서 회신 아이콘 재클릭 시
      if (message.type === 'REPLY_DATA_READY') {
        chrome.runtime.sendMessage(
          { type: 'GET_REPLY_DATA' },
          (resp: {
            data: {
              mails: ReplyMail[];
              to?: string[];
              cc?: string[];
              subject?: string;
              replyError?: string;
            } | null;
          }) => {
            const payload = resp?.data ?? null;
            if (payload) {
              setReplyData(payload);
              setRequestedReplyData(payload);
              setInitialPanelMode('reply');
              setReplyTriggerKey(0);
              setPanelResetKey((k) => k + 1);
            }
          }
        );
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // ── 툴팁: main 진입 시 1회 노출 ─────────────────────────────────

  const dismissTooltip = useCallback(() => setShowTooltip(false), []);

  const goToMain = useCallback(
    (showTip = false) => {
      // Gmail 본문 내용 유무에 따라 초기 모드 결정 → 결정 후 화면 전환
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          const tabId = tabs[0]?.id;
          if (!tabId) {
            setScreen('main');
            if (showTip) setShowTooltip(true);
            return;
          }
          chrome.tabs.sendMessage(
            tabId,
            { type: 'GET_EMAIL_CONTENT' },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  '[ToneFit] GET_EMAIL_CONTENT 실패:',
                  chrome.runtime.lastError.message
                );
              } else {
                const userLength =
                  response?.userLength ??
                  (response?.content ?? '').trim().length;
                devLog('[ToneFit] 사용자 입력 글자수(서명 제외):', userLength);
                // replyData가 있으면 회신 모드 우선
                setInitialPanelMode(
                  replyData
                    ? 'reply'
                    : userLength >= 40
                      ? 'correct'
                      : 'generate'
                );
              }
              setScreen('main');
              if (showTip) setShowTooltip(true);
            }
          );
        })
        .catch(() => {
          setScreen('main');
          if (showTip) setShowTooltip(true);
        });
    },
    [replyData]
  );

  // ── Google 로그인 ────────────────────────────────────────────────

  const handleGoogleLogin = useCallback(async () => {
    setAuthError(null);
    let idToken = '';
    try {
      idToken = await getGoogleIdToken();
      const result = await signInWithGoogle(idToken);

      if (result.isNewUser) {
        // 신규 가입 → 약관 동의 화면으로, id_token 보관
        pendingIdTokenRef.current = idToken;
        setScreen('terms');
      } else {
        // 기존 회원 → 바로 메인 (툴팁 없음)
        goToMain();
      }
    } catch (err: unknown) {
      // 400 TERMS_AGREEMENT_REQUIRED → 신규 유저, 약관 화면으로
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const code = (
        err as { response?: { data?: { error?: { code?: string } } } }
      )?.response?.data?.error?.code;

      if (status === 400 && code === 'TERMS_AGREEMENT_REQUIRED') {
        pendingIdTokenRef.current = idToken;
        setScreen('terms');
        return;
      }

      const message =
        err instanceof Error ? err.message : '로그인에 실패했습니다';
      setAuthError(message);
      console.error('[ToneFit] 로그인 실패:', err);
    }
  }, [goToMain]);

  // ── 약관 동의 완료 ───────────────────────────────────────────────

  const handleTermsComplete = useCallback(
    async (agreedKeys: TermsType[]) => {
      const idToken = pendingIdTokenRef.current;
      // DEV 스킵 케이스 — id_token 없이 바로 main 진입
      if (!idToken) {
        goToMain(true);
        return;
      }

      setAuthError(null);
      try {
        const ALL_TERMS: TermsType[] = [
          'SERVICE',
          'PRIVACY',
          'ANALYTICS',
          'MARKETING',
          'AI_LEARNING',
        ];
        const termsAgreements = ALL_TERMS.map((type) => ({
          type,
          version: TERMS_VERSION,
          agreed: agreedKeys.includes(type),
        }));

        await signInWithGoogle(idToken, termsAgreements);
        pendingIdTokenRef.current = null;
        goToMain(true); // 신규 가입 → 툴팁 표시
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '가입에 실패했습니다';
        setAuthError(message);
        console.error('[ToneFit] 약관 동의 후 가입 실패:', err);
      }
    },
    [goToMain]
  );

  // ── ToneFitPanel 핸들러 ─────────────────────────────────────────

  /** Gmail 작성창 본문과 제목을 content script에서 읽어옴 */
  const getEmailContentFromGmail = useCallback((): Promise<{
    content: string;
    subject: string;
    composeOpen: boolean;
  }> => {
    return new Promise((resolve, reject) => {
      const tabId = activeTabIdRef.current;
      if (!tabId) {
        reject(new Error('활성 탭을 찾을 수 없습니다'));
        return;
      }
      chrome.tabs.sendMessage(
        tabId,
        { type: 'GET_EMAIL_CONTENT' },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve({
            content: response?.content ?? '',
            subject: response?.subject ?? '',
            composeOpen: response?.composeOpen ?? false,
          });
        }
      );
    });
  }, []);

  const handleReplyAnalysisRequest = useCallback(
    async (mails: ReplyMail[], to?: string[], cc?: string[]) => {
      const controller = new AbortController();
      replyAbortControllerRef.current = controller;
      const tabId = activeTabIdRef.current;
      chrome.runtime.sendMessage({ type: 'GENERATION_START', tabId });
      const data = { mails, to, cc };
      try {
        const [analysis, summaryRes] = await Promise.all([
          postReplyAnalysis(data, controller.signal),
          postReplySummary(data, controller.signal),
        ]);
        // 분석 완료 → 오버레이 해제
        chrome.runtime.sendMessage({ type: 'GENERATION_ERROR', tabId });
        return { analysis, summaries: summaryRes.summary_lines };
      } catch (err) {
        chrome.runtime.sendMessage({ type: 'GENERATION_ERROR', tabId });
        if (
          (err as { name?: string })?.name === 'CanceledError' ||
          (err as { name?: string })?.name === 'AbortError'
        ) {
          return { analysis: null, summaries: [] };
        }
        const errObj = err as {
          response?: { status?: number; data?: { error?: { code?: string } } };
        };
        const status = errObj?.response?.status;
        const code = errObj?.response?.data?.error?.code;
        // 약관 미동의
        if (code === 'TERMS_AGREEMENT_REQUIRED') {
          throw Object.assign(new Error('TERMS_AGREEMENT_REQUIRED'), {
            _termsRequired: true,
          });
        }
        // 429 Rate Limited
        if (status === 429) {
          throw Object.assign(new Error('REPLY_API_ERROR'), {
            _replyApiError: true,
          });
        }
        // 502 Bad Gateway
        if (status === 502) {
          throw Object.assign(new Error('REPLY_API_ERROR'), {
            _replyApiError: true,
          });
        }
        throw err;
      }
    },
    []
  );

  const handleReplyAnalysisCancel = useCallback(() => {
    replyAbortControllerRef.current?.abort();
    replyAbortControllerRef.current = null;
    window.close();
  }, []);

  const handleAgreeMailRead = useCallback(async () => {
    await patchTermsAgreement('MAIL_READ', true);
    await patchTermsAgreement('OVERSEAS_TRANSFER', true);
  }, []);

  const handleReplyWriteRequest = useCallback(async (req: ReplyRequest) => {
    chrome.runtime.sendMessage({
      type: 'GENERATION_START',
      tabId: activeTabIdRef.current,
    });
    try {
      return await postReply(req);
    } catch (err) {
      chrome.runtime.sendMessage({
        type: 'GENERATION_ERROR',
        tabId: activeTabIdRef.current,
      });
      throw err;
    }
  }, []);

  /** 교정 시작 전 사전 검증 — 케이스별 에러 타입 throw */
  const handlePreCheck = useCallback(async () => {
    let result: { content: string; composeOpen: boolean };
    try {
      result = await getEmailContentFromGmail();
    } catch {
      throw Object.assign(new Error('FETCH_ERROR'), { _fetchError: true });
    }
    const { content, composeOpen } = result;
    if (!composeOpen) {
      throw Object.assign(new Error('NO_COMPOSE'), { _noCompose: true });
    }
    if (content.trim().length === 0) {
      throw Object.assign(new Error('EMPTY_BODY'), { _empty: true });
    }
    if (content.trim().length < 40) {
      throw Object.assign(new Error('TOO_SHORT'), { _tooShort: true });
    }
  }, [getEmailContentFromGmail]);

  const handleRequest = useCallback(
    async (params: GenerateParams): Promise<GenerateResult> => {
      const tabId = activeTabIdRef.current;
      chrome.runtime.sendMessage({ type: 'GENERATION_START', tabId });

      try {
        // 교정 모드: Gmail 본문 읽어서 교정 API 호출 → 리뷰 뷰로 전환
        if (params.correctionMode) {
          const { content: rawEmail } = await getEmailContentFromGmail();
          // 연속 빈줄 정규화 — BE 오프셋 기준 및 로컬 merge 기준 통일
          const originalEmail = rawEmail.trim().replace(/\n{3,}/g, '\n\n');
          const response = await postCorrection({
            receiver_type: params.receiver,
            purpose: params.purpose,
            original_email: originalEmail,
          });
          // 오버레이는 리뷰 완료(onSuccess) 시점에 제거 — 여기선 유지
          chrome.runtime.sendMessage({ type: 'GENERATION_ERROR', tabId }); // 오버레이 해제
          return {
            type: 'correction' as const,
            changes: response.changes,
            originalEmail,
            receiver: params.receiver,
            purpose: params.purpose,
          };
        }

        // 생성 모드
        const response = await postGeneration({
          receiver_type: params.receiver,
          purpose: params.purpose,
          brief_content: params.emailText,
        });
        return {
          type: 'email' as const,
          subject: response.generated_subject,
          content: response.generated_email.replace(/\\n/g, '\n'),
        };
      } catch (err) {
        chrome.runtime.sendMessage({ type: 'GENERATION_ERROR', tabId });
        throw err;
      }
    },
    [getEmailContentFromGmail]
  );

  /** 에러 종류 판별 — ToneFitPanel의 onError 콜백에서 호출 */
  const handleError = useCallback((err: unknown) => {
    const sessionExpired = (err as { _sessionExpired?: boolean })
      ?._sessionExpired;
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[ToneFit] handleError:', {
      sessionExpired,
      status,
      errMsg,
      err,
    });

    if (sessionExpired) {
      setErrorVariant('session_expired');
      return;
    }
    if (status === 429) {
      setErrorVariant('rate_limited');
      return;
    }
    if (status === 401) {
      setErrorVariant('session_expired');
      return;
    }
    setErrorVariant('generic');
  }, []);

  const handleSuccess = useCallback((subject: string, content: string) => {
    chrome.runtime.sendMessage({
      type: 'INSERT_EMAIL',
      subject,
      content,
      tabId: activeTabIdRef.current,
    });
  }, []);

  /** DEV: 현재 작성창 내용을 읽어 첫 단어를 "[교정됨]"으로 바꾼 mock 결과를 주입 */
  const handleMockInject = useCallback(async () => {
    const tabId = activeTabIdRef.current;
    if (!tabId) {
      devLog('[MockInject] tabId 없음');
      return;
    }
    try {
      const response = await new Promise<{ content: string; subject: string }>(
        (resolve, reject) => {
          chrome.tabs.sendMessage(
            tabId,
            { type: 'GET_EMAIL_CONTENT' },
            (res) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(res);
            }
          );
        }
      );
      const original =
        response.content || '테스트 본문입니다.\n\n두 번째 단락입니다.';
      // 첫 단어만 "[교정됨]" 으로 치환
      const mocked = original.replace(/\S+/, '[교정됨]');
      devLog('[MockInject] original:', JSON.stringify(original));
      devLog('[MockInject] mocked  :', JSON.stringify(mocked));
      handleSuccess(response.subject ?? '', mocked);
    } catch (err) {
      console.error('[MockInject] 실패:', err);
    }
  }, [handleSuccess]);

  const handleReset = useCallback(() => {
    // 새 이메일 작성 → 패널 초기화
  }, []);

  const handleCorrectionsRejected = useCallback(
    (
      items: CorrectionsRejectionItem[],
      receiver: ReceiverType,
      purpose: PurposeType
    ) => {
      const payload = { receiver_type: receiver, purpose, items };
      devLog(
        '[ToneFit] corrections/rejections 전송:',
        JSON.stringify(payload, null, 2)
      );
      postCorrectionsRejections(payload)
        .then((res) => devLog('[ToneFit] corrections/rejections 응답:', res))
        .catch(console.error);
    },
    []
  );

  const handleCancel = useCallback(() => {
    chrome.runtime.sendMessage({
      type: 'GENERATION_ERROR',
      tabId: activeTabIdRef.current,
    });
  }, []);

  /** 세션 만료 에러 → 토큰 제거 후 로그인 화면으로 */
  const handleGoToLogin = useCallback(async () => {
    await clearToken();
    setScreen('start');
  }, []);

  // ── 렌더 ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-background-page flex items-center justify-center">
        <div className="size-6 rounded-full border-2 border-border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-background-page">
      <div className="inner bg-background-surface rounded-xl max-w-[360px] w-full h-full mx-auto overflow-hidden relative">
        {/* 비 Gmail 탭 오버레이 */}
        {!isGmailTab && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background-surface px-6">
            <div className="size-15 rounded-full bg-background-subtle flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 8C4 6.89543 4.89543 6 6 6H26C27.1046 6 28 6.89543 28 8V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V8Z"
                  stroke="var(--color-icon-brand)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 9L16 18L28 9"
                  stroke="var(--color-icon-brand)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-2 items-center text-center">
              <p className="text-lg font-semibold leading-6.5 tracking-tight text-text-primary">
                Gmail에서만 사용할 수 있어요
              </p>
              <p className="text-xs font-normal leading-4.5 tracking-tight text-text-tertiary">
                Gmail 탭으로 이동하면
                <br />
                ToneFit을 바로 사용할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                chrome.tabs.create({ url: 'https://mail.google.com' })
              }
              className="w-full h-11 flex items-center justify-center rounded-xl bg-background-brand text-text-inverse text-sm font-semibold leading-5 tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
            >
              Gmail 열기
            </button>
          </div>
        )}
        {screen === 'start' && (
          <StartView onGoogleLogin={handleGoogleLogin} error={authError} />
        )}
        {screen === 'terms' && (
          <TermsView onComplete={handleTermsComplete} error={authError} />
        )}
        {screen === 'main' && (
          <div className="relative w-full h-full">
            <ToneFitPanel
              key={panelResetKey}
              remainingCount={remainingCount}
              onRequest={handleRequest}
              onSuccess={handleSuccess}
              onReset={handleReset}
              onCancel={handleCancel}
              onError={handleError}
              errorVariant={errorVariant}
              onGoToLogin={handleGoToLogin}
              showHeader={false}
              mode="extension"
              tooltipSlot={
                showTooltip ? <Tooltip onClose={dismissTooltip} /> : undefined
              }
              onChipSelect={dismissTooltip}
              onCorrectionsRejected={handleCorrectionsRejected}
              onPreCheck={
                SHOW_DEV_TOOLBAR && devModeActive ? undefined : handlePreCheck
              }
              initialPanelMode={initialPanelMode}
              requestedPanelMode={requestedPanelMode}
              devForceView={
                SHOW_DEV_TOOLBAR && devModeActive ? devView : undefined
              }
              devPanelMode={
                SHOW_DEV_TOOLBAR && devModeActive ? devPanelMode : undefined
              }
              replyMails={replyData?.mails}
              replyTo={replyData?.to}
              replyCc={replyData?.cc}
              replySubject={replyData?.subject}
              replyError={replyData?.replyError}
              replyTriggerKey={replyTriggerKey}
              onReplyAnalysisRequest={handleReplyAnalysisRequest}
              onReplyAnalysisCancel={handleReplyAnalysisCancel}
              onAgreeMailRead={handleAgreeMailRead}
              onReplyWriteRequest={handleReplyWriteRequest}
              onReplySuccess={(subject, content) => {
                devLog(
                  '[ToneFit] onReplySuccess — subject:',
                  subject,
                  '/ content 길이:',
                  content?.length
                );
                devLog(
                  '[ToneFit] onReplySuccess content 앞 200자:',
                  content?.slice(0, 200)
                );
                devLog('[ToneFit] activeTabId:', activeTabIdRef.current);
                chrome.tabs.sendMessage(activeTabIdRef.current!, {
                  type: 'INSERT_EMAIL',
                  subject,
                  content,
                  isReply: true,
                  tabId: activeTabIdRef.current,
                });
              }}
              onNoCorrectionConfirm={() => window.close()}
            />
          </div>
        )}
      </div>

      {/* DEV 전용 — 화면/뷰 전환 툴바 (SHOW_DEV_TOOLBAR로 노출 제어) */}
      {SHOW_DEV_TOOLBAR && (
        <DevToolbar
          screen={screen}
          onScreenChange={(s) => {
            setScreen(s);
            setDevView(undefined);
          }}
          devView={devView}
          onViewChange={setDevView}
          errorVariant={errorVariant}
          onErrorVariantChange={setErrorVariant}
          devPanelMode={devPanelMode}
          onPanelModeChange={setDevPanelMode}
          devModeActive={devModeActive}
          onDevModeToggle={() => setDevModeActive((v) => !v)}
          onMockInject={handleMockInject}
        />
      )}
    </div>
  );
};

export default Panel;
