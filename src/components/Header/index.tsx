import { FC } from 'react';

interface HeaderProps {}

export const Header: FC<HeaderProps> = (props) => {
  const {} = props;

  return (
    <div className="flex flex-row justify-between p-8">
      <h1 className="text-2xl font-bold">Yiyang Suen 的博客</h1>
      <span></span>
    </div>
  );
};
