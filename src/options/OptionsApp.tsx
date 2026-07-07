import { useEffect, useState, useCallback } from "react";
import { getStoredToken, logout as doLogout } from "../auth";
import { getMyProfile } from "../apiClient";
import type { UserProfile } from "@/types";
import tTonefit from "@/assets/toolbar/t-tonefit.svg";
import Settings from "./Settings";
import Terms from "./Terms";
import Privacy from "./Privacy";
import Header, { type Page } from "./Header";
import ButtonCoreV2 from "@/components/ui/ButtonCoreV2";
import ConfirmDialog from "./ConfirmDialog";

const OptionsApp = () => {
  const [page, setPage] = useState<Page>("settings");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<
    (UserProfile & { picture?: string }) | null
  >(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      setIsLoggedIn(!!token);
      if (!token) return;

      chrome.storage.local.get(
        ["tonefit_popup_cache", "tonefit_user_profile"],
        (result) => {
          const cache = result["tonefit_popup_cache"] as
            | {
                name?: string;
                email?: string;
                picture?: string;
                aiConsent?: boolean;
                marketingConsent?: boolean;
              }
            | undefined;
          const profileStorage = result["tonefit_user_profile"] as
            | { picture?: string }
            | undefined;

          if (cache) {
            setUserProfile({
              nickname: cache.name ?? "",
              email: cache.email ?? "",
              picture: cache.picture,
              ai_learning_agreed: cache.aiConsent ?? false,
              marketing_agreed: cache.marketingConsent ?? false,
            } as UserProfile & { picture?: string });
          }

          getMyProfile()
            .then((profile) => {
              const picture = profileStorage?.picture ?? cache?.picture;
              setUserProfile({ ...profile, picture });
              chrome.storage.local.set({
                tonefit_popup_cache: {
                  name: profile.nickname,
                  email: profile.email,
                  picture,
                  aiConsent: profile.ai_learning_agreed,
                  marketingConsent: profile.marketing_agreed,
                },
              });
            })
            .catch((err) => {
              const status = (err as { response?: { status?: number } })
                ?.response?.status;
              if (status === 401) {
                chrome.storage.local.remove([
                  "tonefit_access_token",
                  "tonefit_user_profile",
                  "tonefit_popup_cache",
                ]);
                setIsLoggedIn(false);
              } else {
                console.error("[ToneFit Options] 프로필 조회 실패:", err);
              }
            });
        },
      );
    })();
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await doLogout();
      chrome.storage.local.remove([
        "tonefit_user_profile",
        "tonefit_popup_cache",
      ]);
      chrome.runtime.sendMessage({ type: "LOGOUT" }).catch(() => {});
      setIsLoggedIn(false);
      setUserProfile(null);
      setShowLogoutDialog(false);
    } catch (err) {
      console.error("[ToneFit Options] 로그아웃 실패:", err);
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-background-page flex items-center justify-center">
        <div className="size-6 rounded-full border-2 border-border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src={tTonefit} alt="ToneFit" className="size-12" />
          <p className="text-lg font-semibold text-text-primary tracking-tight">
            로그인이 필요합니다
          </p>
          <p className="text-sm text-text-secondary tracking-tight">
            Gmail에서 ToneFit을 열고 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  const isTermsPage = page === "terms" || page === "privacy";

  return (
    <div
      className={`min-w-[768px] h-screen pt-2.5 px-8 pb-8 min-h-screen flex flex-col ${isTermsPage ? "" : "bg-background-page"}`}
      style={
        isTermsPage
          ? {
              background:
                "linear-gradient(154.73deg, #ffffff 0%, #f1ecff 90.7%)",
            }
          : undefined
      }
    >
      {showLogoutDialog && (
        <ConfirmDialog
          title="로그아웃할까요?"
          description="다음에 ToneFit을 사용할 때
          다시 로그인할 수 있어요."
          isLoading={isLoggingOut}
          onCancel={() => setShowLogoutDialog(false)}
          footer={
            <div className="flex gap-3">
              <ButtonCoreV2
                variant="ghost"
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 border border-border-default"
                size="lg"
              >
                취소
              </ButtonCoreV2>
              <ButtonCoreV2
                variant="danger"
                onClick={handleLogoutConfirm}
                className="flex-1 !bg-background-danger text-text-inverse"
                size="lg"
              >
                로그아웃
              </ButtonCoreV2>
            </div>
          }
        />
      )}

      <Header
        page={page}
        userProfile={userProfile}
        onNavigate={setPage}
        onLogoutClick={() => setShowLogoutDialog(true)}
      />

      <main className="flex-1 flex flex-col min-h-0">
        {page === "settings" && (
          <Settings
            userProfile={userProfile}
            onNavigateTerms={() => setPage("terms")}
            onNavigatePrivacy={() => setPage("privacy")}
          />
        )}
        {page === "terms" && <Terms />}
        {page === "privacy" && <Privacy />}
      </main>
    </div>
  );
};

export default OptionsApp;
