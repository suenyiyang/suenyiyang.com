import { FC } from 'react';
import Logo from '@/assets/logo.svg';
import { ToggleDark } from './ToggleDark';

interface HeaderProps {}

export const Header: FC<HeaderProps> = (props) => {
  const {} = props;

  return (
    <div className="flex flex-row justify-between py-4 px-8">
      <h1 className="text-2xl font-bold text-white">
        <a href='/'>
          <Logo className="dark:fill-white w-8 h-8" />
        </a>
      </h1>
      <div className="flex">
        <ToggleDark />
      </div>
    </div>
  );
};
