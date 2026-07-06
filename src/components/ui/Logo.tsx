// export type LogoPosition =
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

export interface LogoProps {
  variant: 'default' | 'symbol';
}
const Logo = ({ variant = 'default' }: LogoProps) => {
  const logoText = variant === 'symbol' ? 'TF' : 'ToneFit';

  return (
    <span className="text-2xl font-bold leading-8 tracking-tight text-text-primary text-center">
      <Link to={ROUTES.EDITOR}>{logoText}</Link>
    </span>
  );
};

export default Logo;
