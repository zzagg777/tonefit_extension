/**
 * ToneFit Extension — 팝업 (EXT-03)
 *
 * 4가지 상태:
 *   - logged_in   : 로그인된 계정 정보 + 설정 토글 + 로그아웃 버튼
 *   - logged_out  : 미로그인 안내 + 사이드패널 열기(로그인) 버튼
 *   - logout_confirm  : 로그아웃 확인 다이얼로그 (오버레이)
 *   - ai_confirm  : AI 품질 개선 활용 동의 끄기 확인 다이얼로그 (오버레이)
 */

import { useEffect, useState } from 'react';
import { getStoredToken, logout as doLogout } from '../auth';
import { getMyProfile, toggleTerms } from '../apiClient';
import { ButtonCoreV2 } from '@/components/ui';
import tTonefit from '@/assets/toolbar/t-tonefit.svg';
import profileImg from '@/assets/profile.svg';

// ── 로고 SVG (인라인) ──────────────────────────────────────────────
const LogoIcon = () => (
  <img src={tTonefit} alt="ToneFit" className="relative z-10 size-6" />
);

// ── X 닫기 아이콘 ──────────────────────────────────────────────────
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M18 6L6 18"
      stroke="#D2D6E1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 6L18 18"
      stroke="#D2D6E1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── 토글 컴포넌트 ──────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const Toggle = ({ checked, onChange, disabled = false }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`
      relative flex h-4 w-7.5 shrink-0 items-center rounded-full transition-colors
      disabled:cursor-not-allowed disabled:opacity-50
      ${checked ? 'bg-background-brand justify-end pr-0.5' : 'bg-background-disabled justify-start pl-0.5'}
    `}
  >
    <span className="size-3.5 rounded-full bg-white shadow-sm block" />
  </button>
);

// ── 사용자 프로필 타입 ──────────────────────────────────────────────
interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}

// ── 프로필 아바타 ──────────────────────────────────────────────────
const Avatar = ({ picture, name }: { picture?: string; name: string }) => {
  if (picture) {
    return (
      <span>
        <img
          src={picture}
          alt={name}
          className="size-10.5 rounded-full object-cover shrink-0"
        />
      </span>
    );
  }
  return (
    <span>
      <img
        src={profileImg}
        alt=""
        className="size-10.5 rounded-full object-cover shrink-0"
      />
    </span>
  );
};

// ── 메인 팝업 ──────────────────────────────────────────────────────
type DialogState = 'none' | 'logout' | 'ai_confirm';

const Popup = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isGmail, setIsGmail] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dialog, setDialog] = useState<DialogState>('none');
  const [aiConsent, setAiConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Gmail 탭 여부 감지
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? '';
      setIsGmail(url.startsWith('https://mail.google.com'));
    });
  }, []);

  // 초기 인증 상태 확인
  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      setIsLoggedIn(!!token);

      if (!token) return;

      // 1단계: 캐시에서 즉시 렌더
      chrome.storage.local.get(['tonefit_popup_cache'], (result) => {
          const cache = result['tonefit_popup_cache'] as
            | {
                name?: string;
                email?: string;
                picture?: string;
                aiConsent?: boolean;
                marketingConsent?: boolean;
              }
            | undefined;

          if (cache) {
            setUserProfile({
              name: cache.name ?? '',
              email: cache.email ?? '',
              picture: cache.picture,
            });
            setAiConsent(cache.aiConsent ?? false);
            setMarketingConsent(cache.marketingConsent ?? false);
          }

          // 2단계: 백그라운드에서 API 갱신
          getMyProfile()
            .then((profile) => {
              const next = {
                name: profile.nickname ?? '',
                email: profile.email ?? '',
                picture: cache?.picture,
                aiConsent: profile.ai_learning_agreed ?? false,
                marketingConsent: profile.marketing_agreed ?? false,
              };
              setUserProfile({
                name: next.name,
                email: next.email,
                picture: next.picture,
              });
              setAiConsent(next.aiConsent);
              setMarketingConsent(next.marketingConsent);
              chrome.storage.local.set({ tonefit_popup_cache: next });
            })
            .catch((err) => {
              const status = (err as { response?: { status?: number } })
                ?.response?.status;
              if (status === 401) {
                chrome.storage.local.remove([
                  'tonefit_access_token',
                  'tonefit_popup_cache',
                ]);
                chrome.runtime.sendMessage({ type: 'LOGOUT' }).catch(() => {});
                window.close();
                return;
              }
              console.error('[ToneFit Popup] 프로필 조회 실패:', err);
            });
        });
    })();
  }, []);

  // 사이드 패널 열기
  // const handleOpenSidePanel = async () => {
  //   try {
  //     const [tab] = await chrome.tabs.query({
  //       active: true,
  //       currentWindow: true,
  //     });
  //     if (tab?.id !== null && tab?.id !== undefined) {
  //       await chrome.sidePanel.open({ tabId: tab.id });
  //       window.close();
  //     }
  //   } catch (err) {
  //     console.error('[ToneFit Popup] 사이드 패널 열기 실패:', err);
  //   }
  // };

  // 로그아웃 확정
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await doLogout();
      chrome.storage.local.remove(['tonefit_popup_cache']);
      // 사이드패널에 로그아웃 알림 → 패널이 start 화면으로 이동
      chrome.runtime.sendMessage({ type: 'LOGOUT' }).catch(() => {});
      // 팝업 닫기
      window.close();
    } catch (err) {
      console.error('[ToneFit Popup] 로그아웃 실패:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // AI 동의 토글 처리
  const handleAiToggle = () => {
    if (aiConsent) {
      // ON → OFF: 확인 다이얼로그
      setDialog('ai_confirm');
    } else {
      // OFF → ON: 즉시 반영
      setAiConsent(true);
      chrome.storage.local.set({ tonefit_ai_consent: true });
      toggleTerms('AI_LEARNING', true)
        .then(() => console.error('[ToneFit Popup] AI 동의 ON 성공'))
        .catch((err) =>
          console.error('[ToneFit Popup] AI 동의 재동의 실패:', err)
        );
    }
  };

  // AI 동의 끄기 확정
  const handleAiConsentOff = () => {
    setAiConsent(false);
    chrome.storage.local.set({ tonefit_ai_consent: false });
    setDialog('none');
    toggleTerms('AI_LEARNING', false)
      .then(() => console.error('[ToneFit Popup] AI 동의 OFF 성공'))
      .catch((err) => console.error('[ToneFit Popup] AI 동의 철회 실패:', err));
  };

  // 마케팅 토글 처리 (즉시 반영)
  const handleMarketingToggle = () => {
    const next = !marketingConsent;
    setMarketingConsent(next);
    chrome.storage.local.set({ tonefit_marketing_consent: next });
    toggleTerms('MARKETING', next)
      .then(() =>
        console.error(`[ToneFit Popup] 마케팅 동의 ${next ? 'ON' : 'OFF'} 성공`)
      )
      .catch((err) =>
        console.error('[ToneFit Popup] 마케팅 동의 변경 실패:', err)
      );
  };

  // 외부 링크 열기
  const openLink = (url: string) => {
    chrome.tabs.create({ url });
  };

  // 로딩 중
  if (isLoggedIn === null || isGmail === null) {
    return (
      <div
        className="bg-background-page flex items-center justify-center"
        style={{ width: 340, height: 200 }}
      >
        <div className="size-5 rounded-full border-2 border-border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── 공통 헤더 ─────────────────────────────────────────────────────
  const Header = () => (
    <div className="flex items-center justify-between w-full shrink-0">
      <div className="flex items-center gap-1">
        <div className="size-6 flex items-center justify-center">
          <LogoIcon />
        </div>
        <span className="text-sm font-semibold leading-5 tracking-tight text-black">
          ToneFit
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.close()}
        className="size-6 flex items-center justify-center rounded cursor-pointer hover:bg-background-hover transition-colors"
        aria-label="닫기"
      >
        <XIcon />
      </button>
    </div>
  );

  // ── 개인정보 링크 ──────────────────────────────────────────────────
  const PrivacyLinks = () => (
    <div className="flex items-center justify-center gap-1 w-full shrink-0">
      <button
        type="button"
        onClick={() => openLink('https://tonefit.kr/privacy')}
        className="text-xs font-normal leading-4 tracking-tight text-[#667085] cursor-pointer hover:underline"
      >
        개인정보처리방침
      </button>
      <span className="text-xs leading-4 text-[#667085]">·</span>
      <button
        type="button"
        onClick={() => openLink('https://tonefit.kr/terms')}
        className="text-xs font-normal leading-4 tracking-tight text-[#667085] cursor-pointer hover:underline"
      >
        이용약관
      </button>
    </div>
  );

  // Gmail 탭이 아닌 경우 — 안내 팝업
  if (!isGmail) {
    return (
      <div
        className="bg-background-page flex flex-col gap-5 items-center p-3"
        style={{ width: 340 }}
      >
        <Header />
        <div className="flex flex-col gap-6 items-center w-full pb-2">
          <div className="flex flex-col gap-2 items-center text-center w-full">
            <p className="text-lg font-semibold leading-6.5 tracking-tight text-text-primary">
              Gmail에서만 사용할 수 있어요
            </p>
            <p className="text-xs font-normal leading-4.5 tracking-tight text-text-tertiary">
              Gmail 탭으로 이동한 뒤 ToneFit 아이콘을 눌러주세요.
            </p>
          </div>
        </div>
        <ButtonCoreV2
          onClick={() => {
            chrome.tabs.create({ url: 'https://mail.google.com' });
            window.close();
          }}
        >
          Gmail 열기
        </ButtonCoreV2>
      </div>
    );
  }

  // ── 미로그인 상태 ──────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div
        className="bg-background-page flex flex-col gap-5 items-center p-3"
        style={{ width: 340 }}
      >
        <Header />

        {/* 본문 */}
        <div className="flex flex-col gap-6 items-center w-full pb-2">
          {/* 아바타 플레이스홀더 */}
          <div className="size-15 rounded-full bg-background-subtle flex items-center justify-center shadow-sm">
            <svg
              width="80"
              height="73"
              viewBox="0 0 80 73"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_4300_4880)">
                <path
                  d="M9 38C9 21.4315 22.4315 8 39 8C55.5685 8 69 21.4315 69 38C69 54.5685 55.5685 68 39 68C22.4315 68 9 54.5685 9 38Z"
                  fill="#F8F8FB"
                  shape-rendering="crispEdges"
                />
                <g filter="url(#filter1_d_4300_4880)">
                  <path
                    d="M39 8C55.5685 8 69 21.4315 69 38C69 46.6574 65.3306 54.4559 59.4648 59.9316C59.4187 59.8147 59.3734 59.6973 59.3252 59.5811C58.2196 56.9119 56.5995 54.4862 54.5566 52.4434C52.5138 50.4005 50.0881 48.7804 47.4189 47.6748C44.7498 46.5692 41.8891 46 39 46C36.1109 46 33.2502 46.5692 30.5811 47.6748C27.9119 48.7804 25.4862 50.4005 23.4434 52.4434C21.4005 54.4863 19.7804 56.9119 18.6748 59.5811C18.6266 59.6974 18.5803 59.8145 18.5342 59.9316C12.6688 54.4559 9 46.6572 9 38C9 21.4315 22.4315 8 39 8ZM39 21C32.9249 21 28 25.9249 28 32C28 38.0751 32.9249 43 39 43C45.0751 43 50 38.0751 50 32C50 25.9249 45.0751 21 39 21Z"
                    fill="#F8F8FB"
                  />
                </g>
              </g>
              <defs>
                <filter
                  id="filter0_d_4300_4880"
                  x="5"
                  y="5"
                  width="68"
                  height="68"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="1" />
                  <feGaussianBlur stdDeviation="2" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4300_4880"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4300_4880"
                    result="shape"
                  />
                </filter>
                <filter
                  id="filter1_d_4300_4880"
                  x="0"
                  y="0"
                  width="80"
                  height="71.9316"
                  filterUnits="userSpaceOnUse"
                  color-interpolation-filters="sRGB"
                >
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dx="1" dy="2" />
                  <feGaussianBlur stdDeviation="5" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_4300_4880"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_4300_4880"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col gap-2 items-center text-center w-full">
            <div className="text-lg font-semibold leading-6.5 tracking-tight text-text-primary w-full">
              <p>
                쓰는 법을 몰라도 괜찮아요.
                <br />
                처음부터 끝까지, 당신의 말로.
              </p>
            </div>
            <p className="text-xs font-normal leading-4.5 tracking-tight text-text-tertiary w-full">
              Gmail 작성 화면에서 ToneFit 버튼을 눌러 시작하세요
            </p>
          </div>
        </div>

        {/* 로그인 버튼 */}
        {/* <ButtonCoreV2 onClick={handleOpenSidePanel} className="cursor-pointer">
          로그인
        </ButtonCoreV2> */}
      </div>
    );
  }

  // ── 로그인 상태 (+ 다이얼로그 오버레이) ────────────────────────────
  return (
    <div
      className="bg-background-page flex flex-col gap-4 items-center p-3 relative"
      style={{ width: 340 }}
    >
      <Header />

      {/* 현재 로그인된 계정 */}
      <div className="flex flex-col gap-1 items-start w-full shrink-0">
        <div className="flex items-center w-full py-1.75">
          <p className="flex-1 text-sm font-semibold leading-5 tracking-tight text-text-primary">
            현재 로그인된 계정
          </p>
        </div>
        <div className="bg-background-surface border border-border-default flex gap-4 items-start p-4 rounded-2xl w-full">
          <Avatar
            picture={userProfile?.picture}
            name={userProfile?.name ?? ''}
          />
          <div className="flex flex-col gap-1 items-start whitespace-nowrap">
            <p className="text-sm font-semibold leading-5 tracking-tight text-black">
              {userProfile?.name ?? '사용자'}
            </p>
            <p className="text-xs font-normal leading-[18px] tracking-tight text-black">
              {userProfile?.email ?? ''}
            </p>
          </div>
        </div>
      </div>

      {/* 설정 */}
      <div className="flex flex-col gap-1 items-start w-full shrink-0">
        <div className="flex items-center w-full py-1.75">
          <p className="flex-1 text-sm font-semibold leading-5 tracking-tight text-text-primary">
            설정
          </p>
        </div>
        <div className="flex flex-col gap-1 items-start w-full">
          {/* AI 품질 개선 활용 동의 */}
          <div className="bg-background-surface border border-border-default flex gap-2.5 items-center px-2.5 py-3 rounded-lg w-full">
            <p className="flex-1 text-xs font-semibold leading-4 tracking-tight text-text-secondary min-w-0">
              AI 품질 개선 활용 동의
            </p>
            <Toggle checked={aiConsent} onChange={handleAiToggle} />
          </div>
          {/* 소식 및 혜택 알림 받기 */}
          <div className="bg-background-surface border border-border-default flex gap-2.5 items-center px-2.5 py-3 rounded-lg w-full">
            <p className="flex-1 text-xs font-semibold leading-4 tracking-tight text-text-secondary min-w-0">
              소식 및 혜택 알림 받기
            </p>
            <Toggle
              checked={marketingConsent}
              onChange={handleMarketingToggle}
            />
          </div>
        </div>
      </div>

      <PrivacyLinks />

      {/* 로그아웃 버튼 */}
      <button
        type="button"
        onClick={() => setDialog('logout')}
        className="w-full h-8 flex items-center justify-center rounded-md bg-background-surface shadow-sm text-text-danger text-xs font-semibold leading-4 tracking-tight cursor-pointer hover:bg-background-hover transition-colors"
        style={{ boxShadow: '0px 1px 2px rgba(0,0,0,0.07)' }}
      >
        로그아웃
      </button>
      {/* <ButtonCoreV2
        variant="secondary"
        onClick={() => setDialog('logout')}
        className="text-text-danger"
        style={{ boxShadow: '0px 1px 2px rgba(0,0,0,0.07)' }}
      >
        로그아웃
      </ButtonCoreV2> */}

      {/* ── 오버레이 + 다이얼로그 ── */}
      {dialog !== 'none' && (
        <>
          {/* 오버레이 */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.48)' }}
          />

          {/* 로그아웃 확인 다이얼로그 */}
          {dialog === 'logout' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-surface rounded-xl flex flex-col gap-4 items-center px-2 pt-5 pb-2 w-62.5">
              <div className="flex flex-col gap-2.5 items-center text-center w-full">
                <p className="text-lg font-semibold leading-6.5 tracking-tight text-text-primary w-full">
                  로그아웃할까요?
                </p>
                <div className="text-xs font-normal leading-[18px] tracking-tight text-text-tertiary w-full">
                  <p className="mb-0">다음에 ToneFit을 사용할 때</p>
                  <p>다시 로그인할 수 있어요</p>
                </div>
              </div>
              <div className="flex gap-2.25 items-center justify-center w-full">
                <button
                  type="button"
                  onClick={() => setDialog('none')}
                  className="flex-1 h-8 flex items-center justify-center rounded-md bg-background-surface border border-border-default text-text-primary text-xs font-semibold leading-4 tracking-tight cursor-pointer hover:bg-background-hover transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                  className="flex-1 h-8 flex items-center justify-center rounded-md text-white text-xs font-semibold leading-4 tracking-tight cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#e5484d' }}
                >
                  {isLoggingOut ? '처리 중...' : '로그아웃'}
                </button>
              </div>
            </div>
          )}

          {/* AI 품질 개선 동의 끄기 확인 */}
          {dialog === 'ai_confirm' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-surface rounded-xl flex flex-col gap-4 items-center px-2 pt-5 pb-2 w-[250px]">
              <div className="flex flex-col gap-2.5 items-center text-center w-full">
                <div className="text-lg font-semibold leading-[26px] tracking-tight text-text-primary w-full">
                  <p className="mb-0">AI 품질 개선 활용 동의를</p>
                  <p>끄시겠어요?</p>
                </div>
                <div className="text-xs font-normal leading-[18px] tracking-tight text-text-tertiary w-full">
                  <p className="mb-0">
                    품질 개선 활용 동의를 끄시면 수집된 학습 활용
                  </p>
                  <p>데이터가 즉시 파기되며 되돌릴 수 없어요</p>
                </div>
              </div>
              <div className="flex gap-[9px] items-center justify-center w-full">
                <button
                  type="button"
                  onClick={() => setDialog('none')}
                  className="flex-1 h-8 flex items-center justify-center rounded-md bg-background-surface border border-border-default text-text-brand-strong text-xs font-semibold leading-4 tracking-tight cursor-pointer hover:bg-background-hover transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAiConsentOff}
                  className="flex-1 h-8 flex items-center justify-center rounded-md bg-background-brand text-text-inverse text-xs font-semibold leading-4 tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
                >
                  끄기
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Popup;
