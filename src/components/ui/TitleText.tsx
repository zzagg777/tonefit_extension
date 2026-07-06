import type { HTMLAttributes, ReactNode } from 'react';

/**
 * TitleText
 * - 페이지 상단에 사용하는 타이틀 + 서브타이틀 조합 컴포넌트
 * - heading + subtitle + variant
 * - 'lg': PC용. font-size-6xl / 36px, Bold, 가운데 정렬
 * - 'md': 모바일용. font-size-4xl / 28px, Bold, 가운데 정렬
 *  @example
 *  <TitleText
 *    variant="lg"
 *    heading="ToneFit에 오신 것을 환영합니다"
 *    subtitle="상황에 맞는 비즈니스 이메일 교정을 시작해보세요"
 *  />
 */
type TitleTextVariant = 'lg' | 'md';

interface TitleTextProps extends HTMLAttributes<HTMLDivElement> {
  heading: ReactNode;
  subtitle?: string;
  variant?: TitleTextVariant;
  align?: string;
}

const TitleText = ({
  heading,
  subtitle,
  align = 'center',
  variant = 'lg',
  className = '',
  ...props
}: TitleTextProps) => {
  const isLarge = variant === 'lg';

  return (
    <div
      className={`
        flex flex-col gap-2.5 items-center leading-3.5
        text-${align}
        ${className}
      `}
      {...props}
    >
      {/* 타이틀 */}
      <h2
        className={`
          font-bold text-text-primary tracking-tight w-full break-keep
          ${isLarge ? 'text-4xl leading-11' : 'text-4xl leading-9'}
        `}
      >
        {heading}
      </h2>

      {/* 서브타이틀 */}
      {subtitle && (
        <p className="text-text-secondary text-base leading-6 tracking-tight">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default TitleText;
export type { TitleTextProps, TitleTextVariant };
