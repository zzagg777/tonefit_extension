/**
 * src/components/ui/index.ts
 *
 * 공통 UI 컴포넌트 배럴 익스포트
 * 완성된 컴포넌트는 모두 이 파일에서 re-export합니다.
 *
 * 사용 예시:
 *   import { Button, Chip, TextField } from '@/components/ui';
 */

// ── 기본 요소 ────────────────────────────────────────────────

export { default as Logo } from './Logo';
export type { LogoProps } from './Logo';

export { default as Icon } from './Icon';
export type { IconProps, IconName } from './Icon';

export { default as TitleText } from './TitleText';
export type { TitleTextProps, TitleTextVariant } from './TitleText';

// ── 입력 컴포넌트 ────────────────────────────────────────────
export { default as TextField } from './TextField';
export type { TextFieldProps } from './TextField';

// ── 버튼 컴포넌트 ────────────────────────────────────────────
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonIconPosition } from './Button';

export { default as ButtonAction } from './ButtonAction';
export type {
  ButtonActionProps,
  ButtonActionVariant,
  ButtonActionSize,
} from './ButtonAction';

export { default as ButtonGroup } from './ButtonGroup';
export type { ButtonGroupProps, ButtonGroupOption } from './ButtonGroup';

// ── 선택 컴포넌트 ────────────────────────────────────────────
export { default as Chip } from './Chip';
export type { ChipProps } from './Chip';
export { default as ChipV2 } from './ChipV2';
export type { ChipPropsV2, ChipSizeV2 } from './ChipV2';

export { default as Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

// ── 피드백 / 내비게이션 컴포넌트 ──────────────────────────────
export { default as Stepper } from './Stepper';
export type { StepperProps, StepNumber } from './Stepper';

// ── v2 확장 레이아웃 버튼 ─────────────────────────────────────
export { default as ButtonLongV2 } from './ButtonLongV2';
export type {
  ButtonLongV2Props,
  ButtonLongV2Variant,
  ButtonLongV2Layout,
} from './ButtonLongV2';

export { default as ButtonCoreV2 } from './ButtonCoreV2';
export type {
  ButtonCoreV2Props,
  ButtonCoreV2Variant,
  ButtonCoreV2Layout,
} from './ButtonCoreV2';

export { default as ButtonCheckLongV2 } from './ButtonCheckLongV2';
export type { ButtonCheckLongV2Props } from './ButtonCheckLongV2';

export { default as ButtonTwoWayV2 } from './ButtonTwoWayV2';
export type {
  ButtonTwoWayV2Props,
  ButtonTwoWayV2Option,
} from './ButtonTwoWayV2';
