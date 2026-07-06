import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Icon from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';

/**
 * 버튼 상태 변형
 * - default  : 기본 (진한 배경 + 흰 텍스트) — primary의 별칭
 * - primary  : 주요 액션 (진한 배경 + 흰 텍스트)
 * - mute     : 보조 액션 (회색 배경 + 회색 텍스트) — 클릭 가능, disabled 아님
 * - loading  : AI 처리 중 (회색 배경 + 로딩 스피너) — 자동 비활성화
 * - success  : 완료 (초록 배경 + 체크 아이콘)
 * - danger   : 실패/경고 (빨간 배경 + 금지 아이콘)
 */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'mute'
  | 'loading'
  | 'success'
  | 'danger';

/** 추가 아이콘 위치 (default 상태에서만 적용) */
export type ButtonIconPosition = 'left' | 'right';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼 상태 변형
   * - loading/success/danger 상태는 각각 자동으로 아이콘을 표시합니다.
   * @default 'default'
   */
  variant?: ButtonVariant;
  /**
   * default 상태에서 표시할 추가 아이콘 (선택)
   * loading/success/danger 상태에서는 무시됩니다.
   */
  icon?: IconName;
  /**
   * 추가 아이콘의 위치 (default 상태에서만 적용)
   * @default 'left'
   */
  iconPosition?: ButtonIconPosition;
  /** 버튼 레이블 */
  children: ReactNode;
}

/**
 * Button
 * 전체 너비 CTA 버튼
 *
 * 아이콘 색상 구현 방식:
 * - 버튼 요소 자체에 `hover:text-text-inverse active:text-text-inverse`를
 *   적용합니다. 아이콘이 `color="currentColor"`를 사용하므로 버튼의 text 색상 변화를
 *   레이블 텍스트와 아이콘 모두 자동으로 상속합니다.
 * - default·primary·mute 변형에 적용되며 loading/success/danger 변형은 제외합니다.
 *
 * 아이콘 자동 매핑 (variant별):
 * - loading → Icon name="loading" (스피너)
 * - success → Icon name="check-circle" (체크)
 * - danger  → Icon name="no-symbol" (금지)
 *
 * @example
 * // 기본 (레이블만)
 * <Button>로그인하기</Button>
 *
 * @example
 * // 보조 액션 (mute — 클릭 가능)
 * <Button variant="mute">나중에 하기</Button>
 *
 * @example
 * // 왼쪽 아이콘 + 레이블
 * <Button icon="pencil-ai" iconPosition="left">교정 시작하기</Button>
 *
 * @example
 * // 로딩 상태 (API 호출 중)
 * <Button variant="loading">교정 중...</Button>
 *
 * @example
 * // 성공 상태
 * <Button variant="success">교정 완료!</Button>
 *
 * @example
 * // 에러 상태
 * <Button variant="danger">다시 시도해 주세요</Button>
 *
 * @example
 * // 비활성화
 * <Button disabled>로그인하기</Button>
 */
const Button = ({
  variant = 'default',
  icon,
  iconPosition = 'left',
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) => {
  /*
   * loading 상태에서는 버튼을 자동으로 비활성화합니다.
   */
  const isDisabled = disabled || variant === 'loading';

  /*
   * 상태별 배경·텍스트 색상 클래스
   * disabled 상태는 아래 로직에서 별도로 처리합니다.
   */
  /* primary·default 공통 클래스 (진한 배경 + 흰 텍스트) */
  const primaryClass =
    'bg-background-inverse text-text-inverse ' +
    'hover:bg-background-hover-2 hover:text-text-inverse ' +
    'active:bg-background-pressed-2 active:text-text-inverse';

  const variantClasses: Record<ButtonVariant, string> = {
    default: primaryClass,
    primary: primaryClass,
    mute:
      'bg-background-muted text-text-tertiary ' +
      'hover:bg-background-hover hover:text-text-teriary ' +
      'active:bg-background-pressed active:text-text-placeholder',
    loading: 'bg-background-muted text-text-tertiary cursor-not-allowed',
    success: 'bg-background-success-subtle text-text-success',
    danger: 'bg-background-danger-subtle text-text-danger',
  };

  /*
   * 상태별 자동 아이콘 매핑
   * default 상태는 props.icon을 사용합니다.
   */
  /*
   * 상태별 자동 아이콘 매핑
   * default·primary·mute 상태는 props.icon을 사용합니다.
   */
  const stateIconMap: Partial<Record<ButtonVariant, IconName>> = {
    loading: 'loading',
    success: 'check-circle',
    danger: 'no-symbol',
  };

  const stateIcon = stateIconMap[variant];

  /*
   * 최종 아이콘 결정:
   * loading/success/danger → 상태 아이콘 고정 (항상 왼쪽)
   * default → props.icon + iconPosition 사용
   */
  const resolvedIcon: IconName | undefined = stateIcon ?? icon;
  const isStateIcon = stateIcon !== undefined;
  const showLeftIcon =
    !!resolvedIcon && (isStateIcon || iconPosition === 'left');
  const showRightIcon =
    !!resolvedIcon && !isStateIcon && iconPosition === 'right';

  /*
   * 아이콘 래퍼 span 클래스
   *
   * 아이콘 색상은 버튼 요소의 hover:text-text-inverse /
   * active:text-text-inverse를 color="currentColor"로 자동 상속합니다.
   * 래퍼 span의 transition-colors로 아이콘 색상 전환을 부드럽게 처리합니다.
   *
   * loading/success/danger variant는 인터랙티브 hover 상태가 없으므로
   * transition-colors를 제외합니다.
   */
  /* default·primary·mute는 인터랙티브하므로 transition-colors 적용 */
  const iconWrapperClass =
    variant === 'default' || variant === 'primary' || variant === 'mute'
      ? 'shrink-0 transition-colors'
      : 'shrink-0';

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`
        w-full flex items-center justify-center gap-2.5
        h-16.5 px-5 py-4
        rounded-2xl
        text-2xl leading-8 font-bold tracking-tight
        transition-colors
        ${
          isDisabled && variant !== 'loading'
            ? /* Disabled: 회색 배경 + 테두리 + 클릭 불가 */
              'bg-background-disabled border border-border-disabled text-text-disabled cursor-not-allowed'
            : variantClasses[variant]
        }
        ${className}
      `}
      {...props}
    >
      {/* 왼쪽 아이콘 래퍼 */}
      {showLeftIcon && (
        <span className={iconWrapperClass}>
          <Icon name={resolvedIcon!} size={24} color="currentColor" />
        </span>
      )}

      {/* 레이블 */}
      {children}

      {/* 오른쪽 아이콘 래퍼 (default 상태 + iconPosition='right'일 때만) */}
      {showRightIcon && (
        <span className={iconWrapperClass}>
          <Icon name={resolvedIcon!} size={24} color="currentColor" />
        </span>
      )}
    </button>
  );
};

export default Button;
export type { ButtonProps };
