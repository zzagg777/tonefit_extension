import { useState, useRef, useEffect } from "react";
import LegalPageLayout from "./LegalPageLayout";
import PrivacyContent from "./content/PrivacyContent";
import BehavioralContent from "./content/BehavioralContent";
import MarketingContent from "./content/MarketingContent";
import AiContent from "./content/AiContent";

type PrivacyTab = "privacy" | "behavioral" | "marketing" | "ai";

const TABS: { id: PrivacyTab; label: string }[] = [
  { id: "privacy", label: "개인정보처리방침" },
  { id: "behavioral", label: "행태정보 수집·이용 고지" },
  { id: "marketing", label: "마케팅 수신 동의 안내" },
  { id: "ai", label: "AI 학습 활용 안내" },
];

const CONTENT_MAP: Record<PrivacyTab, React.ComponentType> = {
  privacy: PrivacyContent,
  behavioral: BehavioralContent,
  marketing: MarketingContent,
  ai: AiContent,
};

const Privacy = () => {
  const [activeTab, setActiveTab] = useState<PrivacyTab>("privacy");
  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? "";
  const ContentComponent = CONTENT_MAP[activeTab];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  return (
    <LegalPageLayout
      title={activeLabel}
      scrollRef={scrollRef}
      header={
        <div className="flex items-center justify-center shrink-0">
          <div className="flex items-center gap-1 px-1 h-11.75 rounded-2xl bg-background-subtle shadow-[4px_2px_12px_rgba(124,77,255,0.10)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center justify-center px-2.5 py-2.5 rounded-xl w-37.5
                  text-sm font-semibold tracking-tight leading-5 cursor-pointer transition-colors
                  ${
                    activeTab === tab.id
                      ? "bg-background-selected text-text-brand"
                      : "text-text-placeholder hover:text-text-secondary"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <ContentComponent />
    </LegalPageLayout>
  );
};

export default Privacy;
