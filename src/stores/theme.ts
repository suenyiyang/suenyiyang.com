import { atom } from 'jotai';
import type { ThemeMode } from '~/logic/themeToggle';

export const isDarkAtom = atom<boolean>();
export const themeModeAtom = atom<ThemeMode>('auto');
