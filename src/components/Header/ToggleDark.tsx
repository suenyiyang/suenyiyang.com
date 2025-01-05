'use client';

import { useThemeStore } from '@/logic/theme';
import { FC } from 'react';

interface ToggleDarkProps {}

export const ToggleDark: FC<ToggleDarkProps> = (props) => {
  const isDark = useThemeStore((state) => state.isDark);
  const { toggleDarkMode } = useThemeStore((state) => state.actions);

  return <button onClick={toggleDarkMode}>{isDark ? '🌞' : '🌛'}</button>;
};
