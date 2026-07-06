import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * 입력 필드 상단에 표시할 라벨 텍스트 (선택)
   * - 값이 있으면 라벨 행을 렌더링합니다.
   * - 없으면 라벨 영역을 렌더링하지 않습니다.
   */
  label?: string;
  /**
   * 라벨+입력 전체를 감싸는 컨테이너 div의 추가 클래스
   * label prop이 없을 때는 무시됩니다.
   */
  containerClassName?: string;
  /**
   * 우측에 표시할 아이콘 이름 (Icon 컴포넌트의 IconName)
   * rightSlot이 있으면 rightSlot이 우선 적용됩니다.
   */
  rightIcon?: IconName;
  /**
   * rightIcon 클릭 핸들러
   * 제공되면 아이콘을 클릭 가능한 <button>으로 감쌉니다.
   * (예: 비밀번호 표시/숨기기 토글)
   */
  onRightIconClick?: () => void;
  /**
   * 우측 아이콘 버튼의 토글 상태 (스크린리더용 aria-pressed)
   * 비밀번호 표시/숨기기처럼 on/off 상태가 있을 때 전달
   */
  rightIconPressed?: boolean;
  /**
   * 우측 커스텀 슬롯 (예: 비밀번호 show/hide 토글 버튼)
   * rightIcon보다 우선 적용됩니다.
   */
  rightSlot?: ReactNode;
  /**
   * 에러 상태
   * - true 또는 에러 메시지 문자열이면 테두리를 border-border-danger로 변경합니다.
   * - react-hook-form의 errors.field?.message를 직접 전달할 수 있습니다.
   * @default false
   */
  error?: boolean | string;
  /**
   * 외부 래퍼 div에 추가할 클래스
   * (예: 너비 지정 w-full 등)
   */
  wrapperClassName?: string;
}

/**
 * TextField
 *
 * 텍스트 입력 필드입니다.
 * react-hook-form의 register()와 함께 사용할 수 있도록 forwardRef로 구현됩니다.
 *
 * label prop이 있으면 라벨 행(+ 선택적 필수 마크)을 입력 필드 위에 표시합니다.
 * label이 없으면 입력 필드만 렌더링합니다.
 *
 *
 * @example
 * // 라벨 없음 — 우측 아이콘
 * <TextField placeholder="이메일을 입력해 주세요" rightIcon="mail" />
 *
 * @example
 * // 라벨 있음
 * <TextField label="이메일" placeholder="이메일을 입력해 주세요" rightIcon="mail" />
 *
 * @example
 * // 라벨 + 필수 입력 + 에러 상태
 * <TextField
 *   label="비밀번호"
 *   required
 *   type="password"
 *   error={!!errors.password}
 *   {...register('password')}
 * />
 *
 * @example
 * // react-hook-form 연동 + 에러 상태 (라벨 없음)
 * <TextField {...register('email')} error={!!errors.email} rightIcon="mail" />
 *
 * @example
 * // 우측 커스텀 슬롯 (비밀번호 토글 버튼)
 * <TextField
 *   type="password"
 *   rightSlot={
 *     <button type="button" onClick={toggleShow}>
 *       <Icon name={show ? 'hide' : 'lock'} size={24} color="var(--color-icon-secondary)" />
 *     </button>
 *   }
 * />
 */
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      containerClassName = '',
      rightIcon,
      onRightIconClick,
      rightIconPressed,
      rightSlot,
      error = false,
      disabled,
      required,
      wrapperClassName = '',
      className = '',
      onChange,
      ...inputProps
    },
    ref
  ) => {
    const [isFilled, setIsFilled] = useState(false);
    const isDisabled = disabled;

    /*
     * 입력 필드 래퍼 (테두리·배경색 담당)
     * - focus-within으로 자식 <input>의 포커스를 감지합니다.
     * - 우선순위: disabled > error > default/focus
     */
    const inputWrapper = (
      <div
        className={`
          flex items-center gap-2.5
          h-16.5 rounded-lg px-6
          border transition-colors
          ${
            isDisabled
              ? /* Disabled: 회색 배경 + 회색 테두리 + 클릭 불가 커서 */
                'bg-background-disabled border-border-disabled cursor-not-allowed'
              : error
                ? /* Error: 연한 배경 + 빨간 테두리 */
                  'bg-background-subtle border-border-danger '
                : /* Default / Focus */
                  'bg-background-subtle border-border-default focus-within:border-border-focus'
          }
          ${wrapperClassName}
        `}
      >
        {/*
         * 실제 <input> 요소
         * - flex-1 min-w-0: 우측 슬롯을 제외한 나머지 공간을 채웁니다.
         */}
        <input
          onChange={(e) => {
            setIsFilled(e.target.value.length > 0);
            onChange?.(e);
          }}
          ref={ref}
          disabled={isDisabled}
          required={required}
          className={`
            flex-1 min-w-0 bg-transparent outline-none
            text-lg leading-6.5 font-semibold tracking-tight
            placeholder:text-text-placeholder placeholder:font-normal
            disabled:text-text-disabled disabled:cursor-not-allowed
            ${error ? 'text-text-danger' : 'text-text-secondary'}
            ${className}
            
          `}
          {...inputProps}
        />

        {/*
         * 우측 슬롯 영역 (우선순위: rightSlot > onRightIconClick+rightIcon > rightIcon)
         * - rightSlot: 완전한 커스텀 ReactNode
         * - onRightIconClick + rightIcon: 클릭 가능한 버튼으로 아이콘 렌더링
         * - rightIcon 단독: 정적 아이콘 렌더링
         */}
        {rightSlot ??
          (rightIcon && onRightIconClick ? (
            <button
              type="button"
              onClick={onRightIconClick}
              tabIndex={-1}
              aria-pressed={rightIconPressed}
              className="shrink-0 cursor-pointer"
            >
              <Icon
                name={rightIcon}
                size={24}
                color={
                  isFilled
                    ? 'var(--color-icon-secondary)'
                    : 'var(--color-icon-placeholder)'
                }
              />
            </button>
          ) : rightIcon ? (
            <Icon
              name={rightIcon}
              size={24}
              color={
                isFilled
                  ? 'var(--color-icon-secondary)'
                  : 'var(--color-icon-placeholder)'
              }
              className="shrink-0"
            />
          ) : null)}
      </div>
    );

    /*
     * label이 없으면 입력 래퍼만 반환합니다.
     */
    if (!label) {
      return inputWrapper;
    }

    /*
     * label이 있으면 라벨 행 + 입력 래퍼를 수직으로 배치합니다.
     */
    return (
      <div className={`flex flex-col ${containerClassName}`}>
        {/*
         * 라벨 행
         * - Figma 기준: flex + gap-2.5 + px-2.5 + pb-2.5
         * - pb-2.5이 라벨과 입력 필드 사이 간격 역할을 합니다.
         */}
        <div className="flex gap-2.5 items-center px-2.5 pb-2.5">
          {/* 라벨 텍스트: Body/L Regular */}
          <span
            className={`text-base leading-6 tracking-tight font-normal ${error ? 'text-text-danger' : 'text-text-tertiary'}`}
          >
            {label}
          </span>

          {/*
           * 필수 입력 마크 (*)
           * - required prop이 true일 때만 표시
           * - aria-hidden: 스크린 리더는 <input required>로 필수 여부를 인지
           */}
          {required && (
            <span
              aria-hidden="true"
              className="text-base leading-6 tracking-tight text-text-danger font-normal"
            >
              *
            </span>
          )}
        </div>

        {inputWrapper}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;
export type { TextFieldProps };
