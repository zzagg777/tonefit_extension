import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * ButtonCheckLongV2 — 전체 폭 확인 동의 버튼 (v2)
 *
 * 약관 전체 동의처럼 확인 의미가 강한 전체 폭 액션에 사용합니다.
 * - 체크 아이콘 + 중앙 정렬 레이블 + 균형 스페이서 구조
 * - 높이 고정 54px (h-13.5)
 * - 전체 폭
 */
export interface ButtonCheckLongV2Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 레이블 */
  children: ReactNode;
  /** 왼쪽 체크 아이콘 대체 (기본값: 'check') */
  checkIcon?: ReactNode;
}

/**
 * ButtonCheckLongV2
 *
 * @example
 * <ButtonCheckLongV2>약관에 모두 동의합니다</ButtonCheckLongV2>
 *
 * @example
 * <ButtonCheckLongV2 disabled>약관에 모두 동의합니다</ButtonCheckLongV2>
 */
const ButtonCheckLongV2 = ({
  children,
  checkIcon,
  disabled,
  className = '',
  ...props
}: ButtonCheckLongV2Props) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`
        w-full flex items-center justify-center gap-4
        h-13.5 px-6 rounded-lg
        text-lg font-semibold leading-[26px] tracking-tight
        transition-colors
        ${
          disabled
            ? 'bg-background-disabled text-text-disabled cursor-not-allowed pointer-events-none'
            : 'bg-background-brand text-text-inverse ' +
              'hover:bg-background-brand-hover ' +
              'active:bg-background-brand-pressed'
        }
        ${className}
      `}
      {...props}
    >
      {/* 왼쪽 체크 아이콘 */}
      <span className="shrink-0 size-5 flex items-center justify-center">
        {checkIcon ?? <Icon name="check" size={20} color="currentColor" />}
      </span>

      {/* 레이블 — 중앙 정렬을 위해 flex-1 */}
      <span className="flex-1 text-center whitespace-nowrap">{children}</span>

      {/* 균형 스페이서 — 아이콘과 같은 너비로 레이블을 시각적 중앙에 배치 */}
      <span className="shrink-0 size-5" aria-hidden />
    </button>
  );
};

export default ButtonCheckLongV2;
