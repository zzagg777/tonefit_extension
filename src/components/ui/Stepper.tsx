/**
 * Stepper
 *
 * 회원가입 진행 단계를 시각적으로 표시하는 컴포넌트입니다.
 *
 * 구조:
 *   [단계 원] ─── 연결선 ─── [단계 원] ─── 연결선 ─── [단계 원]
 *    레이블                    레이블                    레이블
 *
 * step prop 기준:
 *   1 → 약관 동의 진행 중 (원 1개 활성)
 *   2 → 회원가입 진행 중 (원 1개 완료 + 원 2개 활성)
 *   3 → 가입 완료 진행 중 (원 1·2 완료 + 원 3개 활성)
 *   4 → 모든 단계 완료 (원 3개 모두 완료)
 */

/** 내부용 체크마크 SVG (완료된 단계 원 안에 표시) */
const CheckMark = () => (
  <svg
    width="18"
    height="13"
    viewBox="0 0 18 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M1.5 6.5L7 12L16.5 1.5"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── 타입 ────────────────────────────────────────────────────────

/**
 * 현재 단계 번호
 * 1=약관동의 진행, 2=회원가입 진행, 3=가입완료 진행, 4=모두 완료
 */
type StepNumber = 1 | 2 | 3 | 4;

interface StepperProps {
  /**
   * 현재 활성 단계
   * @default 1
   */
  step?: StepNumber;
  /**
   * 각 단계 레이블 (3개 고정)
   * @default ['약관 동의', '회원가입', '가입 완료']
   */
  labels?: [string, string, string];
  className?: string;
}

// ── 상태 계산 헬퍼 ────────────────────────────────────────────

/** 해당 단계가 완료되었는지 (현재 단계를 이미 지났는지) */
const isCompleted = (stepIndex: number, current: StepNumber) =>
  current > stepIndex;

/** 해당 단계가 현재 활성 단계인지 */
const isActive = (stepIndex: number, current: StepNumber) =>
  current === stepIndex;

/**
 * 단계 원의 배경색
 * - 완료 또는 활성: bg-background-inverse (진한 배경)
 * - 미진행: bg-background-muted (연한 배경)
 */
const getCircleBg = (stepIndex: number, current: StepNumber) =>
  isCompleted(stepIndex, current) || isActive(stepIndex, current)
    ? 'bg-background-inverse'
    : 'bg-background-muted';

/**
 * 단계 번호 텍스트 색상
 * - 활성: text-text-inverse (흰색)
 * - 미진행: text-text-secondary (회색)
 */
const getNumberColor = (stepIndex: number, current: StepNumber) =>
  isActive(stepIndex, current) ? 'text-text-inverse' : 'text-text-secondary';

/**
 * 연결선 배경색
 * afterStep: 이 선 바로 앞 단계 번호 (1 또는 2)
 * - 해당 단계가 완료되면 진한 선(bg-border-strong)
 * - 아직 미완료면 연한 선(bg-border-default)
 */
const getLineBg = (afterStep: number, current: StepNumber) =>
  current > afterStep ? 'bg-border-strong' : 'bg-border-default';

/**
 * 레이블 색상 (Figma 스펙 기준)
 *
 * 단계 1 "약관 동의"
 *   → 항상 text-text-secondary (step=1부터 표시되므로 항상 활성 이상)
 *
 * 단계 2 "회원가입"
 *   → step >= 2: text-text-secondary (활성 or 완료)
 *   → step < 2:  text-text-disabled
 *
 * 단계 3 "가입 완료"
 *   → step >= 4(완전 완료): text-text-secondary
 *   → 그 외(진행 중 포함): text-text-disabled
 *   (Figma 기준: step=3 활성 상태에서도 disabled 유지)
 */
const getLabelColor = (stepIndex: number, current: StepNumber) => {
  if (stepIndex === 1) return 'text-text-secondary';
  if (stepIndex === 2)
    return current >= 2 ? 'text-text-secondary' : 'text-text-disabled';
  if (stepIndex === 3)
    return current >= 4 ? 'text-text-secondary' : 'text-text-disabled';
  return 'text-text-disabled';
};

// ── 내부 서브 컴포넌트 ─────────────────────────────────────────

interface StepCircleProps {
  index: number; // 단계 번호 (1, 2, 3)
  label: string; // 단계 레이블
  current: StepNumber;
}

/**
 * StepCircle
 *
 * 단계 원 + 아래 레이블의 단위 컴포넌트입니다.
 *
 * 시각 스펙:
 * - 원: 40×40px, rounded-full
 * - 레이블: absolute top-11.5, 가로 중앙 정렬
 * - 타이포그래피 (원 숫자): Title/L (20px / SemiBold / 28px line-height / -0.02em tracking)
 * - 타이포그래피 (레이블): Body/S (12px / Regular / 18px line-height / -0.02em tracking)
 */
const StepCircle = ({ index, label, current }: StepCircleProps) => {
  const done = isCompleted(index, current);

  return (
    /*
     * 컨테이너
     * - relative: 레이블 절대 위치 기준
     * - shrink-0: 연결선에 의해 압축되지 않도록
     */
    <div className="flex flex-col items-center relative shrink-0">
      {/*
       * 단계 원
       * - 완료: 진한 배경 + 체크마크
       * - 활성: 진한 배경 + 흰색 숫자
       * - 미진행: 연한 배경 + 회색 숫자
       */}
      <div
        className={`
          size-10 rounded-full
          flex items-center justify-center
          transition-colors
          ${getCircleBg(index, current)}
        `}
        aria-label={
          done
            ? `${label} 완료`
            : isActive(index, current)
              ? `${label} 진행 중`
              : label
        }
      >
        {done ? (
          /* 완료 상태: 흰색 체크마크 */
          <CheckMark />
        ) : (
          /* 활성 or 미진행: 단계 번호 */
          <span
            className={`
              text-xl leading-7 font-semibold tracking-tight
              ${getNumberColor(index, current)}
            `}
          >
            {index}
          </span>
        )}
      </div>

      {/*
       * 레이블
       * - absolute: 원 아래 6px 간격으로 배치 (top-11.5 = circle 40px + gap 6px)
       * - left-1/2 -translate-x-1/2: 원 기준 가로 중앙 정렬
       * - whitespace-nowrap: 텍스트가 한 줄로 유지되도록
       */}
      <p
        className={`
          absolute top-11.5
          left-1/2 -translate-x-1/2
          whitespace-nowrap text-center
          text-xs leading-4.5 font-normal tracking-tight
          transition-colors
          ${getLabelColor(index, current)}
        `}
      >
        {label}
      </p>
    </div>
  );
};

// ── 메인 컴포넌트 ──────────────────────────────────────────────

/**
 * @example
 * // 약관 동의 단계
 * <Stepper step={1} />
 *
 * @example
 * // 회원가입 단계
 * <Stepper step={2} />
 *
 * @example
 * // 모든 단계 완료
 * <Stepper step={4} />
 *
 * @example
 * // 커스텀 레이블
 * <Stepper
 *   step={2}
 *   labels={['약관 동의', '정보 입력', '완료']}
 * />
 */
const Stepper = ({
  step = 1,
  labels = ['약관 동의', '회원가입', '가입 완료'],
  className = '',
}: StepperProps) => {
  return (
    /*
     * 최상위 컨테이너
     * - pb-6: 절대 위치된 레이블(top-11.5)이 잘리지 않도록 하단 여백 확보
     *   총 높이: 원 40px + 여백 6px + 레이블 18px = 64px
     * - relative: 내부 레이블 absolute 포지셔닝 기준
     */
    <div
      className={`
        flex gap-2.5 items-center
        pb-6 relative w-full max-w-90
        ${className}
      `}
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label="회원가입 진행 단계"
    >
      {/* 단계 1 */}
      <StepCircle index={1} label={labels[0]} current={step} />

      {/*
       * 연결선 1 (단계 1~2 사이)
       * - flex-1: 남은 공간을 채워 단계 원 사이를 연결
       * - h-0.5: Figma 기준 선 두께
       * - rounded-full: 선 끝을 부드럽게
       */}
      <div
        className={`
          flex-1 h-0.5 rounded-full transition-colors
          ${getLineBg(1, step)}
        `}
        aria-hidden="true"
      />

      {/* 단계 2 */}
      <StepCircle index={2} label={labels[1]} current={step} />

      {/* 연결선 2 (단계 2~3 사이) */}
      <div
        className={`
          flex-1 h-0.5 rounded-full transition-colors
          ${getLineBg(2, step)}
        `}
        aria-hidden="true"
      />

      {/* 단계 3 */}
      <StepCircle index={3} label={labels[2]} current={step} />
    </div>
  );
};

export default Stepper;
export type { StepperProps, StepNumber };
