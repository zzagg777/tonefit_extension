import type { ButtonHTMLAttributes, ReactNode } from 'react';

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────

/** 칩 크기 */
export type ChipSize = 'sm' | 'md' | 'lg';

/**
 * 미선택 상태의 배경 타입
 * - default : gray-50 계열 (bg-background-subtle)
 * - surface : white 계열 (bg-background-surface)
 */
export type ChipType = 'default' | 'surface';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 선택 여부
   * - true  : bg-background-inverse + text-text-inverse (진한 배경)
   * - false : 미선택 스타일 (type에 따라 배경 결정)
   * @default false
   */
  selected?: boolean;
  /**
   * 칩 크기
   * - sm : 32px 높이, rounded-full (pill), text-base
   * - md : 46px 높이, rounded-2xl, text-lg
   * - lg : 66px 높이, rounded-2xl, text-lg
   * @default 'lg'
   */
  size?: ChipSize;
  /**
   * 미선택 상태의 배경 타입
   * - default : bg-background-subtle (gray-50 계열)
   * - surface : bg-background-surface (white)
   * @default 'default'
   */
  variant?: ChipType;
  /** 칩 레이블 텍스트 */
  children: ReactNode;
}

// ──────────────────────────────────────────────
// 사이즈별 스타일
// ──────────────────────────────────────────────

interface SizeConfig {
  base: string; // height + padding
  text: string; // typography
  radius: string; // border-radius
}

const SIZE_CONFIG: Record<ChipSize, SizeConfig> = {
  sm: {
    base: 'h-8 px-6',
    text: 'text-base leading-6 tracking-tight font-semibold',
    radius: 'rounded-full',
  },
  md: {
    base: 'h-11.5 px-6',
    text: 'text-lg leading-6.5 tracking-tight font-semibold',
    radius: 'rounded-2xl',
  },
  lg: {
    base: 'h-16.5 px-6',
    text: 'text-lg leading-6.5 tracking-tight font-semibold',
    radius: 'rounded-2xl',
  },
};

// ──────────────────────────────────────────────
// 상태별 스타일
// ──────────────────────────────────────────────

/**
 * 선택된(selected) 칩 — variant=true
 * type 무관, 공통 스타일
 */
const SELECTED_CLASS =
  'bg-background-inverse text-text-inverse ' +
  'hover:bg-background-hover-2 ' +
  'active:bg-background-pressed-2';

/**
 * 미선택(unselected) 칩 — variant=false
 * Default type: hover 시 opacity-60 추가 (Figma 기준)
 * Surface type: hover 시 opacity 변화 없음
 */
const UNSELECTED_CLASS: Record<ChipType, string> = {
  default:
    'bg-background-subtle text-text-placeholder ' +
    'hover:bg-background-hover-2 hover:text-text-inverse ' +
    'active:bg-background-pressed-2',
  surface:
    'bg-background-surface text-text-placeholder ' +
    'hover:bg-background-hover ' +
    'active:bg-background-pressed',
};

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

/**
 * Chip (chip_select)
 *
 * 선택 가능한 칩 버튼 컴포넌트. (Figma node 298:2065)
 * 수신자 유형·이메일 목적 선택 등 단일/다중 선택 UI에 사용합니다.
 *
 * 크기별 스펙 (Figma 기준):
 * ┌──────┬──────────┬──────────────┬────────────────────┐
 * │ size │  height  │    radius    │        text        │
 * ├──────┼──────────┼──────────────┼────────────────────┤
 * │  sm  │  32px    │ rounded-full │ text-base / 24px   │
 * │  md  │  46px    │ rounded-2xl  │ text-lg   / 26px   │
 * │  lg  │  66px    │ rounded-2xl  │ text-lg   / 26px   │
 * └──────┴──────────┴──────────────┴────────────────────┘
 *
 * 상태별 스타일 (CLAUDE.md 4.4 기준):
 * ┌─────────────────────┬────────────────────────────────────────────────┐
 * │ selected=true       │ bg-inverse / text-inverse                      │
 * │   hover             │ bg-hover-2                                     │
 * │   pressed           │ bg-pressed-2                                   │
 * ├─────────────────────┼────────────────────────────────────────────────┤
 * │ selected=false      │ variant=default → bg-subtle / variant=surface → white│
 * │   hover (default)   │ bg-hover + opacity-60                          │
 * │   hover (surface)   │ bg-hover                                       │
 * │   pressed           │ bg-pressed                                     │
 * ├─────────────────────┼────────────────────────────────────────────────┤
 * │ disabled            │ bg-disabled / text-disabled / 클릭 차단        │
 * └─────────────────────┴────────────────────────────────────────────────┘
 *
 * @example
 * // 기본 사용 (lg, default variatn)
 * <Chip selected={isSelected} onClick={handleClick}>상사</Chip>
 *
 * @example
 * // sm 사이즈 (pill 형태)
 * <Chip size="sm" selected={isSelected}>보고</Chip>
 *
 * @example
 * // md 사이즈
 * <Chip size="md" selected={isSelected}>요청</Chip>
 *
 * @example
 * // Surface 배경 타입 (흰 배경)
 * <Chip size="lg" variant="surface" selected={isSelected}>고객사</Chip>
 *
 * @example
 * // 단일 선택 그룹
 * const [selected, setSelected] = useState<ReceiverType | null>(null);
 * {RECEIVER_TYPE_OPTIONS.map(opt => (
 *   <Chip
 *     key={opt.value}
 *     selected={selected === opt.value}
 *     onClick={() => setSelected(opt.value)}
 *   >
 *     {RECEIVER_TYPE_LABELS[opt.value]}
 *   </Chip>
 * ))}
 */
const Chip = ({
  selected = false,
  size = 'lg',
  variant = 'default',
  disabled,
  children,
  className = '',
  ...props
}: ChipProps) => {
  const cfg = SIZE_CONFIG[size];

  const stateClass = disabled
    ? 'bg-background-disabled text-text-disabled cursor-not-allowed pointer-events-none'
    : selected
      ? SELECTED_CLASS
      : UNSELECTED_CLASS[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={[
        'inline-flex items-center justify-center whitespace-nowrap',
        'transition-colors',
        cfg.base,
        cfg.text,
        cfg.radius,
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

export default Chip;
