import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ThemeColors } from './colors';
import { space, radius, target } from './spacing';
import { typography } from './typography';

export type ThemePref = 'system' | 'light' | 'dark';

export interface Theme {
  colors: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  target: typeof target;
  typography: typeof typography;
  isDark: boolean;
}

export const ThemePrefContext = createContext<ThemePref>('system');

export function useTheme(prefOverride?: ThemePref): Theme {
  const ctx = useContext(ThemePrefContext);
  const pref = prefOverride ?? ctx;
  const system = useColorScheme();
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return {
    colors: isDark ? darkColors : lightColors,
    space,
    radius,
    target,
    typography,
    isDark,
  };
}
