import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonCoreV2Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonCoreV2Size = 'sm' | 'md' | 'lg';

export interface ButtonCoreV2Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonCoreV2Variant;
  size?: ButtonCoreV2Size;
  isLoading?: boolean;
  children: ReactNode;
}

const ButtonCoreV2 = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonCoreV2Props) => {
  const isDisabled = disabled || isLoading;

  const sizeClasses = {
    sm: 'h-8 px-3 py-2 text-xs leading-4 rounded-md gap-1.5',
    md: 'h-10 px-4 py-2.5 text-sm leading-5 rounded-lg gap-2',
    lg: 'h-12 px-5 py-3 text-base leading-6 rounded-lg gap-2',
  };

  const spinnerSizeClass = { sm: 'size-3.5', md: 'size-4', lg: 'size-4.5' };

  const enabledClasses: Record<ButtonCoreV2Variant, string> = {
    primary:
      'bg-action-primary-default text-action-primary-foreground ' +
      'hover:bg-action-primary-hover active:bg-action-primary-pressed',
    secondary:
      'bg-background-surface border border-border-default text-text-brand-strong ' +
      'hover:bg-background-brand-subtle hover:border-border-brand ' +
      'active:bg-background-selected active:border-border-brand',
    ghost:
      'text-text-secondary ' +
      'hover:bg-background-hover active:bg-background-pressed',
    danger:
      'bg-background-danger-subtle border border-border-danger text-text-danger',
  };

  const disabledClasses: Record<ButtonCoreV2Variant, string> = {
    primary:
      'bg-action-primary-disabled-background text-action-primary-disabled-foreground',
    secondary:
      'bg-background-disabled border border-border-disabled text-text-disabled',
    ghost: 'text-text-disabled',
    danger:
      'bg-background-disabled border border-border-disabled text-text-disabled',
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`
        w-full flex items-center justify-center
        font-semibold tracking-tight transition-colors cursor-pointer
        ${isDisabled ? 'opacity-80 cursor-not-allowed pointer-events-none' : ''}
        ${sizeClasses[size]}
        ${isDisabled ? disabledClasses[variant] : enabledClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <span
          className={`shrink-0 ${spinnerSizeClass[size]} rounded-full border-2 border-current border-t-transparent animate-spin`}
        />
      )}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

export default ButtonCoreV2;
