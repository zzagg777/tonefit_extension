import type { ButtonHTMLAttributes, ReactNode } from 'react';

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────

/** 칩 크기 — sm: h-7(28px) / md: h-9(36px) */
export type ChipSizeV2 = 'sm' | 'md';

export interface ChipPropsV2 extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 선택 여부 @default false */
  selected?: boolean;
  /** 칩 크기 @default 'sm' */
  size?: ChipSizeV2;
  /** 칩 레이블 텍스트 */
  children: ReactNode;
}

// ──────────────────────────────────────────────
// 상태별 스타일
// ──────────────────────────────────────────────

// 선택됨 — enabled
// hover: bg-brand-purple-100(#eee7ff) + text-brand-strong + border-focus
const SELECTED_CLASS =
  'bg-background-selected text-text-brand border-border-brand ' +
  'hover:bg-[var(--color-brand-purple-100)] hover:text-text-brand-strong hover:border-border-focus ' +
  'active:bg-[var(--color-brand-purple-100)]';

// 미선택 — enabled
// hover: bg-background-hover + text-brand + border-brand
const UNSELECTED_CLASS =
  'bg-background-surface text-text-secondary border-border-default ' +
  'hover:bg-background-hover hover:text-text-brand hover:border-border-brand ' +
  'active:bg-background-hover';

// disabled (선택 여부 무관)
const DISABLED_CLASS =
  'bg-background-disabled text-text-disabled border-border-disabled ' +
  'cursor-not-allowed pointer-events-none';

// 크기별 스펙
const SIZE_CLASS: Record<ChipSizeV2, string> = {
  sm: 'h-7 px-3 text-xs leading-4', // 28px / px-12px / 12px
  md: 'h-9 px-4 text-sm leading-5', // 36px / px-16px / 14px
};

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

/**
 * ChipV2 (Choice Chip / Core v2)
 *
 * 선택 가능한 칩 버튼. 수신자 유형·이메일 목적 선택 등 단일/다중 선택 UI에 사용합니다.
 *
 * Props:
 * - selected : 선택 여부
 * - size     : 'sm'(28px) | 'md'(36px)
 * - disabled : 비활성화
 */
const ChipV2 = ({
  selected = false,
  size = 'sm',
  disabled,
  children,
  className = '',
  ...props
}: ChipPropsV2) => {
  const stateClass = disabled
    ? DISABLED_CLASS
    : selected
      ? SELECTED_CLASS
      : UNSELECTED_CLASS;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'inline-flex items-center justify-center whitespace-nowrap',
        'rounded-full border font-semibold transition-colors',
        SIZE_CLASS[size],
        stateClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
};

export default ChipV2;
