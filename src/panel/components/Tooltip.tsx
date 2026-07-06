/**
 * Tooltip — 패널 진입 안내 툴팁
 *
 * Figma: node 3668-24545
 * variant: 'info'(파란) | 'warning'(주황) — 색상 베리에이션 구분용
 */

interface TooltipProps {
  variant?: 'info' | 'warning';
  onClose: () => void;
}

const InfoIcon = ({ variant }: { variant: 'info' | 'warning' }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke={
        variant === 'info'
          ? 'var(--color-info-400, #60A5FA)'
          : 'var(--color-warning-500, #D9822B)'
      }
      strokeWidth="1.5"
    />
    <path
      d="M12 11V16M12 8.5V8"
      stroke={
        variant === 'info'
          ? 'var(--color-info-400, #60A5FA)'
          : 'var(--color-warning-500, #D9822B)'
      }
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = ({ variant }: { variant: 'info' | 'warning' }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 7L17 17M17 7L7 17"
      stroke={
        variant === 'info'
          ? 'var(--color-text-info, #60A5FA)'
          : 'var(--color-warning-500, #D9822B)'
      }
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Tooltip = ({ variant = 'info', onClose }: TooltipProps) => {
  const isWarning = variant === 'warning';

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-2xl w-full ${
        isWarning ? 'bg-background-warning-subtle' : 'bg-background-info-subtle'
      }`}
    >
      <InfoIcon variant={variant} />

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <p
          className={`text-2xs font-bold leading-3.5 tracking-tight ${
            isWarning ? 'text-text-warning' : 'text-text-info'
          }`}
        >
          수신자·목적을 고르고 상황만 적어주세요.
        </p>
        <p
          className={`text-2xs font-normal leading-3.5 tracking-tight ${
            isWarning ? 'text-text-warning' : 'text-text-info'
          }`}
        >
          Gmail에 바로 넣을 수 있는 메일 초안을 만들어드려요.
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 cursor-pointer"
      >
        <CloseIcon variant={variant} />
      </button>
    </div>
  );
};

export default Tooltip;
