import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────

/** 버튼 색상 계열 */
export type ButtonActionVariant = 'primary' | 'muted';

/** 버튼 크기 */
export type ButtonActionSize = 'sm' | 'md' | 'lg';

export interface ButtonActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼 색상 계열
   * - primary : 진한 배경(bg-background-inverse) + 흰 텍스트
   * - muted   : 회색 배경(bg-background-muted) + 연한 텍스트
   * @default 'primary'
   */
  variant?: ButtonActionVariant;
  /**
   * 버튼 크기
   * - sm : 12px 텍스트, px-2 py-0.5, 아이콘 14px
   * - md : 14px 텍스트, px-4 py-1,   아이콘 16px
   * - lg : 16px 텍스트, px-5 py-2,   아이콘 18px
   * @default 'md'
   */
  size?: ButtonActionSize;
  /**
   * 왼쪽 아이콘 (children 있으면 Icon + Label 레이아웃)
   * children 없으면 Icon Only 레이아웃
   */
  leftIcon?: IconName;
  /**
   * 오른쪽 아이콘 (children 있을 때만 유효 — Label + Icon 레이아웃)
   */
  rightIcon?: IconName;
  iconViewBox?: string;
  /**
   * 로딩 상태 — spinner 아이콘으로 교체, 클릭 비활성화
   * leftIcon/rightIcon보다 우선합니다.
   */
  isLoading?: boolean;
  /**
   * 성공 상태 — check-circle 아이콘으로 교체
   */
  isSuccess?: boolean;
  /**
   * 에러 상태 — x 아이콘으로 교체
   */
  isError?: boolean;
  /** 버튼 레이블. 없으면 Icon Only 레이아웃 */
  children?: ReactNode;
}

// ──────────────────────────────────────────────
// 사이즈별 스타일 정의
// ──────────────────────────────────────────────

interface SizeConfig {
  /** 레이블 있을 때 패딩 */
  paddingWithLabel: string;
  /** 아이콘만 있을 때 패딩 */
  paddingIconOnly: string;
  /** 아이콘 간격 */
  gap: string;
  /** 텍스트 클래스 */
  text: string;
  /** 아이콘 크기 (px) */
  iconSize: number;
}

const SIZE_CONFIG: Record<ButtonActionSize, SizeConfig> = {
  sm: {
    paddingWithLabel: 'px-2 py-0.5',
    paddingIconOnly: 'p-0.5',
    gap: 'gap-0.5',
    text: 'text-xs leading-4 tracking-tight',
    iconSize: 14,
  },
  md: {
    paddingWithLabel: 'px-4 py-1',
    paddingIconOnly: 'p-1',
    gap: 'gap-0.5',
    text: 'text-sm leading-5 tracking-tight',
    iconSize: 16,
  },
  lg: {
    paddingWithLabel: 'px-5 py-2',
    paddingIconOnly: 'p-1.5',
    gap: 'gap-1',
    text: 'text-base leading-6 tracking-tight',
    iconSize: 18,
  },
};

// ──────────────────────────────────────────────
// 변형별 스타일 정의
// ──────────────────────────────────────────────

const VARIANT_CLASS: Record<ButtonActionVariant, string> = {
  primary:
    'bg-background-inverse text-text-inverse ' +
    'hover:bg-background-hover-2 ' +
    'active:bg-background-pressed-2',
  muted:
    'bg-background-muted text-text-tertiary ' +
    'hover:bg-background-hover ' +
    'active:bg-background-pressed',
};

// ──────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────

/**
 * ButtonAction (btn_action)
 *
 * 인라인 소형 액션 버튼. 주로 카드·행·모달 내 부가 액션에 사용합니다.
 *
 * 레이아웃은 props 조합으로 자동 결정됩니다:
 * - children만          → Label Only
 * - children + leftIcon → Icon + Label
 * - children + rightIcon → Label + Icon
 * - leftIcon/rightIcon만 → Icon Only
 *
 * @example
 * // Label Only
 * <ButtonAction>저장</ButtonAction>
 *
 * @example
 * // Icon + Label
 * <ButtonAction leftIcon="plus">추가</ButtonAction>
 *
 * @example
 * // Label + Icon (화살표)
 * <ButtonAction rightIcon="arrow-right">다음</ButtonAction>
 *
 * @example
 * // Icon Only
 * <ButtonAction leftIcon="copy" aria-label="복사" />
 *
 * @example
 * // Muted variant
 * <ButtonAction variant="muted" leftIcon="x">취소</ButtonAction>
 *
 * @example
 * // 로딩 상태
 * <ButtonAction isLoading>저장 중...</ButtonAction>
 *
 * @example
 * // 성공 상태
 * <ButtonAction isSuccess>저장됨</ButtonAction>
 */
const ButtonAction = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  iconViewBox,
  isLoading = false,
  isSuccess = false,
  isError = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonActionProps) => {
  const cfg = SIZE_CONFIG[size];
  const hasChildren = !!children;
  const isDisabled = disabled || isLoading;

  // ── 아이콘 결정 ──
  // isLoading/isSuccess/isError 는 leftIcon을 override
  const resolvedLeftIcon: IconName | undefined = isLoading
    ? 'loading'
    : isSuccess
      ? 'check-circle'
      : isError
        ? 'x'
        : leftIcon;

  const resolvedRightIcon: IconName | undefined =
    isLoading || isSuccess || isError ? undefined : rightIcon;

  const iconOnly = !hasChildren;

  // ── 패딩 ──
  const padding = iconOnly ? cfg.paddingIconOnly : cfg.paddingWithLabel;

  // ── 최종 클래스 ──
  const classes = [
    // 베이스
    'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap',
    'transition-colors',
    // 간격
    cfg.gap,
    // 패딩
    padding,
    // 텍스트
    cfg.text,
    // 변형 (disabled가 아닐 때)
    isDisabled
      ? 'bg-background-muted text-text-disabled cursor-not-allowed'
      : VARIANT_CLASS[variant],
    // disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" disabled={isDisabled} className={classes} {...props}>
      {/* 왼쪽 아이콘 */}
      {resolvedLeftIcon && (
        <span className="shrink-0 flex items-center justify-center">
          <Icon
            name={resolvedLeftIcon}
            size={cfg.iconSize}
            color="currentColor"
            className={isLoading ? 'animate-spin' : ''}
            // 상태 아이콘(loading/success/error)은 항상 24x24 viewBox 사용
            // 커스텀 아이콘일 때만 iconViewBox 적용
            {...(!isLoading && !isSuccess && !isError && iconViewBox
              ? { viewBox: iconViewBox }
              : {})}
          />
        </span>
      )}

      {/* 레이블 */}
      {hasChildren && <span>{children}</span>}

      {/* 오른쪽 아이콘 */}
      {resolvedRightIcon && (
        <span className="shrink-0 flex items-center justify-center">
          <Icon
            name={resolvedRightIcon}
            size={cfg.iconSize}
            color="currentColor"
            {...(iconViewBox ? { viewBox: iconViewBox } : {})}
          />
        </span>
      )}
    </button>
  );
};

export default ButtonAction;
