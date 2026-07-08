import imgPanelIcon from "@/assets/mail-logo.svg";

/**
 * 패널 헤더 — 로고 + 잔여 횟수 뱃지
 *
 * 데모 페이지에서는 표시 / 익스텐션 사이드 패널에서는 숨김
 * ToneFitPanel의 showHeader prop으로 제어하거나, 독립적으로 사용 가능
 */
export const PanelHeader = ({ remainingCount }: { remainingCount: number }) => (
  <div className="flex items-center justify-between px-4 py-5 shrink-0">
    <div className="flex items-center gap-2.5">
      <img src={imgPanelIcon} alt="ToneFit" className="size-8 object-contain" />
      <span className="text-lg font-semibold leading-[26px] tracking-tight text-text-primary">
        이메일 생성
      </span>
    </div>
    <button
      type="button"
      className="w-27 h-7 bg-background-selected border border-border-brand rounded-full text-xs font-semibold leading-4 tracking-tight text-text-brand"
    >
      {remainingCount}회 무료체험 가능
    </button>
  </div>
);
