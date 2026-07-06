/**
 * ButtonTwoWayV2 — 양방향 세그먼트 선택 버튼 (v2)
 *
 * 2개의 옵션 중 하나를 선택하는 전체 폭 세그먼트 컨트롤입니다.
 * - 선택된 세그먼트: 브랜드 보라 배경 + 흰 텍스트
 * - 미선택 세그먼트: 흰 배경 + 기본 테두리 + 보조 텍스트
 * - 외부 컨테이너 높이 56px, 내부 세그먼트 높이 48px
 */

interface ButtonTwoWayV2Option {
  /** 옵션 고유 값 */
  value: string;
  /** 세그먼트에 표시할 텍스트 */
  label: string;
}

interface ButtonTwoWayV2Props {
  /**
   * 정확히 2개의 옵션 [A, B]
   */
  options: [ButtonTwoWayV2Option, ButtonTwoWayV2Option];
  /** 현재 선택된 옵션의 value */
  value: string;
  /** 옵션 변경 핸들러 */
  onChange: (value: string) => void;
  /** 전체 비활성화 */
  disabled?: boolean;
  className?: string;
}

/**
 * ButtonTwoWayV2
 *
 * @example
 * const [mode, setMode] = useState('original');
 * <ButtonTwoWayV2
 *   options={[
 *     { value: 'original',  label: '원문' },
 *     { value: 'corrected', label: '교정문' },
 *   ]}
 *   value={mode}
 *   onChange={setMode}
 * />
 */
const ButtonTwoWayV2 = ({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}: ButtonTwoWayV2Props) => {
  return (
    <div
      role="group"
      className={`
        w-full flex items-center gap-2 p-1
        h-14 rounded-xl
        bg-background-subtle border border-border-default
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 flex items-center justify-center
              h-12 rounded-lg
              text-base font-semibold leading-6 tracking-tight
              transition-colors whitespace-nowrap
              ${
                isSelected
                  ? 'bg-background-brand text-text-inverse border border-background-brand'
                  : 'bg-background-surface text-text-secondary border border-border-default ' +
                    'hover:bg-background-hover'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonTwoWayV2;
export type { ButtonTwoWayV2Props, ButtonTwoWayV2Option };
