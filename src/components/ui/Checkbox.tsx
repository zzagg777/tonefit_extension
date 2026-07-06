import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 체크박스 우측에 표시할 레이블 텍스트 */
  label?: string;
}

/**
 * Checkbox
 *
 * 레이블이 있는 체크박스 컴포넌트입니다.
 * react-hook-form의 register()와 함께 사용할 수 있도록 forwardRef로 구현됩니다.
 *
 * 시각 스펙 (Figma 기준):
 * - 체크박스: 18×18px / rounded-sm
 * - 체크 색상: accent-background-inverse (진한 배경색)
 * - 레이블: Body/S (14px / Regular / 20px line-height / -0.02em tracking)
 * - 레이블 색상: text-text-secondary
 *
 * @example
 * // 기본 사용
 * <Checkbox label="자동 로그인" />
 *
 * @example
 * // react-hook-form 연동
 * <Checkbox label="약관에 동의합니다" {...register('agree')} />
 *
 * @example
 * // 레이블 없이 단독 사용
 * <Checkbox aria-label="전체 선택" {...register('selectAll')} />
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-6 h-6 rounded-sm
            accent-background-inverse cursor-pointer
            ${className}
          `}
          {...props}
        />
        {label && (
          <span className="text-base leading-5 text-text-secondary tracking-tight font-normal">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
export type { CheckboxProps };
