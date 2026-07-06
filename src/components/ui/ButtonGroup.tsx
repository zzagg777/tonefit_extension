import Button from './Button';

interface ButtonGroupOption {
  /** 옵션 고유 값 (onChange에서 반환됩니다) */
  value: string;
  /** 버튼에 표시할 텍스트 */
  label: string;
}

interface ButtonGroupProps {
  /**
   * 정확히 2개의 옵션 [A, B]
   * (Figma 디자인 기준 2-way 토글)
   */
  options: [ButtonGroupOption, ButtonGroupOption];
  /** 현재 선택된 옵션의 value */
  value: string;
  /** 옵션 변경 핸들러 */
  onChange: (value: string) => void;
  /** 전체 비활성화 */
  disabled?: boolean;
  className?: string;
}

/**
 * ButtonGroup
 * 2개의 옵션 중 하나를 선택하는 토글 버튼 그룹
 *
 * 구성:
 * - 미선택 버튼 → Button variant="mute"
 * - 선택됨 버튼 → Button variant="primary"
 * - 각 버튼 flex-1로 동일한 너비 유지
 *
 * 접근성:
 * - role="group"으로 버튼 그룹임을 표시합니다.
 * - aria-pressed로 각 버튼의 선택 상태를 스크린 리더에 전달합니다.
 *
 * @example
 * // 수락/재교정 토글
 * const [action, setAction] = useState('accept');
 * <ButtonGroup
 *   options={[
 *     { value: 'accept',    label: '수락' },
 *     { value: 'recorrect', label: '재교정' },
 *   ]}
 *   value={action}
 *   onChange={setAction}
 * />
 *
 * @example
 * // 원문/교정문 비교 토글
 * const [view, setView] = useState('original');
 * <ButtonGroup
 *   options={[
 *     { value: 'original',  label: '원문' },
 *     { value: 'corrected', label: '교정문' },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 */
const ButtonGroup = ({
  options,
  value,
  onChange,
  disabled = false,
  className = '',
}: ButtonGroupProps) => {
  return (
    /*
     * 버튼 그룹 컨테이너
     * - disabled일 때 opacity-50 + pointer-events-none으로 전체 비활성화
     *   (각 Button에 disabled를 넘기지 않아 Button 자체의 disabled 스타일을 적용하지 않음)
     */
    <div
      role="group"
      className={`
        flex gap-2 items-center
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isLast = index === options.length - 1;

        return (
          <Button
            key={option.value}
            variant={isSelected ? 'primary' : 'mute'}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            disabled={isLast && !isSelected}
            className="flex-1 border-0"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

export default ButtonGroup;
export type { ButtonGroupProps, ButtonGroupOption };
