import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme';

type Variant = 'body' | 'bodyMuted' | 'bodySubtle' | 'caption' | 'h1' | 'h2' | 'h3' | 'numeric' | 'numericLarge';

const VARIANT_STYLES: Record<Variant, TextStyle> = {
  body: { fontSize: 16, lineHeight: 24 },
  bodyMuted: { fontSize: 16, lineHeight: 24 },
  bodySubtle: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  h1: { fontSize: 32, lineHeight: 40, letterSpacing: -0.6 },
  h2: { fontSize: 24, lineHeight: 32, letterSpacing: -0.4 },
  h3: { fontSize: 20, lineHeight: 28, letterSpacing: -0.2 },
  numeric: { fontSize: 16, lineHeight: 24 },
  numericLarge: { fontSize: 32, lineHeight: 40, letterSpacing: -0.4 },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  weight?: 'regular' | 'medium' | 'semibold';
  color?: 'fg' | 'fgMuted' | 'fgSubtle' | 'fgOnInk' | 'danger' | 'success' | 'appAccent';
  mono?: boolean;
}

export function Text({ variant = 'body', weight, color, mono, style, ...rest }: TextProps) {
  const { colors, typography } = useTheme();
  const computedColor =
    color === 'fgMuted' ? colors.fgMuted :
    color === 'fgSubtle' ? colors.fgSubtle :
    color === 'fgOnInk' ? colors.fgOnInk :
    color === 'danger' ? colors.danger :
    color === 'success' ? colors.success :
    color === 'appAccent' ? colors.appAccent :
    colors.fg;

  const family = mono
    ? (weight === 'medium' || weight === 'semibold' ? typography.monoEmphasis : typography.mono)
    : weight === 'semibold'
      ? typography.heading
      : weight === 'medium'
        ? typography.bodyEmphasis
        : (variant === 'h1' || variant === 'h2' || variant === 'h3' ? typography.heading : typography.body);

  return (
    <RNText
      style={[VARIANT_STYLES[variant], { color: computedColor, fontFamily: family }, style]}
      {...rest}
    />
  );
}
