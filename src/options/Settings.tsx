import { useState, useCallback, useEffect } from "react";
import { toggleTerms } from "../apiClient";
import type { UserProfile } from "@/types";
import ConfirmDialog from "./ConfirmDialog";

// ── 토글 컴포넌트 ──────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export const Toggle = ({
  checked,
  onChange,
  disabled = false,
}: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`
      relative flex h-8 w-15 shrink-0 items-center rounded-full transition-colors cursor-pointer
      disabled:cursor-not-allowed disabled:opacity-50
      ${checked ? "bg-background-brand justify-end pr-1" : "bg-background-disabled justify-start pl-1"}
    `}
  >
    <span className="size-6.75 rounded-full bg-white shadow-sm block" />
  </button>
);

// ── 설정 페이지 콘텐츠 ─────────────────────────────────────────────
interface SettingsProps {
  userProfile: UserProfile | null;
  onNavigateTerms: () => void;
  onNavigatePrivacy: () => void;
}

type DialogState = "none" | "ai_confirm";

const Settings = ({
  userProfile,
  onNavigateTerms,
  onNavigatePrivacy,
}: SettingsProps) => {
  const [dialog, setDialog] = useState<DialogState>("none");
  const [aiConsent, setAiConsent] = useState(
    userProfile?.ai_learning_agreed ?? false,
  );
  const [marketingConsent, setMarketingConsent] = useState(
    userProfile?.marketing_agreed ?? false,
  );

  useEffect(() => {
    if (userProfile) {
      setAiConsent(userProfile.ai_learning_agreed);
      setMarketingConsent(userProfile.marketing_agreed);
    }
  }, [userProfile]);

  const updateCache = useCallback(
    (patch: { aiConsent?: boolean; marketingConsent?: boolean }) => {
      chrome.storage.local.get("tonefit_popup_cache", (result) => {
        const prev = (result["tonefit_popup_cache"] as Record<string, unknown>) ?? {};
        chrome.storage.local.set({ tonefit_popup_cache: { ...prev, ...patch } });
      });
    },
    [],
  );

  const handleAiToggle = useCallback(() => {
    if (aiConsent) {
      setDialog("ai_confirm");
    } else {
      setAiConsent(true);
      updateCache({ aiConsent: true });
      toggleTerms("AI_LEARNING", true).catch((err) =>
        console.error("[ToneFit Options] AI 동의 ON 실패:", err),
      );
    }
  }, [aiConsent, updateCache]);

  const handleAiConsentOff = useCallback(() => {
    setAiConsent(false);
    setDialog("none");
    updateCache({ aiConsent: false });
    toggleTerms("AI_LEARNING", false).catch((err) =>
      console.error("[ToneFit Options] AI 동의 OFF 실패:", err),
    );
  }, [updateCache]);

  const handleMarketingToggle = useCallback(() => {
    const next = !marketingConsent;
    setMarketingConsent(next);
    updateCache({ marketingConsent: next });
    toggleTerms("MARKETING", next).catch((err) =>
      console.error("[ToneFit Options] 마케팅 동의 변경 실패:", err),
    );
  }, [marketingConsent, updateCache]);

  return (
    <>
      {dialog === "ai_confirm" && (
        <ConfirmDialog
          title="AI 품질 개선 활용 동의를
끄시겠어요?"
          description="품질 개선 활용 동의를 끄시면 수집된 학습 활용 
데이터가 즉시 파기되며 되돌릴 수 없어요"
          confirmLabel="끄기"
          onConfirm={handleAiConsentOff}
          onCancel={() => setDialog("none")}
        />
      )}

      <div className="bg-background-surface rounded-4xl p-10 flex flex-col gap-6 flex-1 shadow-[0px_4px_16px_rgba(124,77,255,0.14)]">
        <h1 className="text-3xl-plus font-bold text-text-secondary tracking-tight leading-10">
          설정
        </h1>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 px-5 py-10 border border-border-default rounded-lg bg-background-surface">
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              <p className="text-2xl font-bold text-text-secondary tracking-tight leading-8">
                AI 품질 개선 활용 동의
              </p>
              <p className="text-lg text-text-secondary tracking-tight leading-7">
                보다 정확한 메일 작성 경험을 제공하기 위해 익명 데이터를 AI 학습
                및 개선에 활용합니다.
              </p>
            </div>
            <Toggle checked={aiConsent} onChange={handleAiToggle} />
          </div>

          <div className="flex items-center gap-2.5 px-5 py-10 border border-border-default rounded-lg bg-background-surface">
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              <p className="text-2xl font-bold text-text-secondary tracking-tight leading-8">
                소식 및 혜택 알림 받기
              </p>
              <p className="text-lg text-text-secondary tracking-tight leading-7">
                새로운 기능, 업데이트, 이벤트 등 ToneFit의 다양한 소식을
                받아보세요.
              </p>
            </div>
            <Toggle
              checked={marketingConsent}
              onChange={handleMarketingToggle}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-text-secondary">
          <button
            type="button"
            onClick={onNavigateTerms}
            className="text-base tracking-tight cursor-pointer"
          >
            이용약관
          </button>
          <span className="text-xs tracking-tight">·</span>
          <button
            type="button"
            onClick={onNavigatePrivacy}
            className="text-base tracking-tight cursor-pointer"
          >
            개인정보처리방침
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;
