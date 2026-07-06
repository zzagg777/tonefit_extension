import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

/**
 * ButtonCoreV2 — 전체 폭 CTA 버튼 (Extended Layout v2)
 *
 * 기존 Button 컴포넌트와 역할은 동일하되, 화면 배치 방식을 별도로 관리합니다.
 * - variant: Primary(브랜드 보라) / Secondary(아웃라인 브랜드)
 * - layout: label-only / icon-label / label-icon
 * - 높이 고정 48px, 전체 폭
 */
export type ButtonCoreV2Variant = 'primary' | 'secondary';
export type ButtonCoreV2Layout = 'label-only' | 'icon-label' | 'label-icon';

export interface ButtonCoreV2Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼 변형
   * - primary  : 브랜드 보라 배경 + 흰 텍스트
   * - secondary: 흰 배경 + 브랜드 보라 테두리/텍스트
   * @default 'primary'
   */
  variant?: ButtonCoreV2Variant;
  /**
   * 레이블 배치 방식
   * - label-only : 텍스트만
   * - icon-label : 왼쪽 아이콘 + 텍스트
   * - label-icon : 텍스트 + 오른쪽 아이콘
   * @default 'label-only'
   */
  layout?: ButtonCoreV2Layout;
  /** label-only 가 아닌 경우 표시할 아이콘 이름 */
  icon?: IconName;
  /** 로딩 상태 — 자동으로 loading 아이콘 표시 및 비활성화 */
  isLoading?: boolean;
  children: ReactNode;
}

/**
 * ButtonCoreV2
 *
 * @example
 * // Primary, 레이블만
 * <ButtonCoreV2>이메일 생성하기</ButtonCoreV2>
 *
 * @example
 * // Secondary, 왼쪽 아이콘
 * <ButtonCoreV2 variant="secondary" layout="icon-label" icon="pencil-ai">
 *   교정 다시 보기
 * </ButtonCoreV2>
 *
 * @example
 * // 로딩 중
 * <ButtonCoreV2 isLoading>이메일 생성하기</ButtonCoreV2>
 */
const ButtonCoreV2 = ({
  variant = 'primary',
  layout = 'label-only',
  icon,
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonCoreV2Props) => {
  const isDisabled = disabled || isLoading;
  const hasIcon = layout !== 'label-only';
  const resolvedIcon: IconName = isLoading ? 'loading' : (icon ?? 'pencil-ai');

  /* 변형별 베이스 색상 클래스 */
  const variantClasses: Record<ButtonCoreV2Variant, string> = {
    primary:
      'bg-action-primary-default text-text-inverse border-action-primary-default ' +
      'hover:bg-action-primary-hover hover:border-action-primary-hover ' +
      'active:bg-action-primary-pressed active:border-action-primary-pressed',
    secondary:
      'bg-background-surface text-text-brand border border-border-brand ' +
      'hover:bg-background-brand-subtle ' +
      'active:bg-background-brand-subtle active:border-background-brand-pressed',
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`
        w-full flex items-center justify-center
        h-8 px-5 py-3 rounded-md
        text-xs font-semibold leading-4 tracking-tight cursor-pointer
        transition-colors
        ${hasIcon ? 'gap-2' : ''}
        ${
          isDisabled
            ? 'bg-background-disabled border border-border-disabled text-text-disabled cursor-not-allowed pointer-events-none'
            : variantClasses[variant]
        }
        ${className}
      `}
      {...props}
    >
      {/* 왼쪽 아이콘 */}
      {(layout === 'icon-label' || isLoading) && (
        <span className="shrink-0">
          <Icon name={resolvedIcon} size={16} color="currentColor" />
        </span>
      )}

      {/* 레이블 */}
      <span className="whitespace-nowrap">{children}</span>

      {/* 오른쪽 아이콘 */}
      {layout === 'label-icon' && !isLoading && (
        <span className="shrink-0">
          <Icon name={icon ?? 'arrow-right'} size={16} color="currentColor" />
        </span>
      )}
    </button>
  );
};

export default ButtonCoreV2;
