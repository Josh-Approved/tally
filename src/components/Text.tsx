import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme, typography, scaledLineHeight } from '../theme';

type Variant = 'body' | 'bodyMuted' | 'bodySubtle' | 'caption' | 'h1' | 'h2' | 'h3' | 'numeric' | 'numericLarge';

// Leading has to be READ at render time, not frozen at import time: RN scales
// fontSize by the OS text-size setting but never a literal lineHeight, so a
// pinned number collides and clips at large Dynamic Type (canon § Accessibility;
// gate `a11y/scalable-line-height`). These are getters for the same reason the
// `type` scale in src/theme/typography.ts is — each read picks up the live
// scale, and at scale 1.0 the values are byte-identical to the old literals.
const VARIANT_STYLES: Record<Variant, TextStyle> = {
  get body() {
    return { fontSize: 16, lineHeight: scaledLineHeight(24) };
  },
  get bodyMuted() {
    return { fontSize: 16, lineHeight: scaledLineHeight(24) };
  },
  get bodySubtle() {
    return { fontSize: 14, lineHeight: scaledLineHeight(20) };
  },
  get caption() {
    return { fontSize: 12, lineHeight: scaledLineHeight(16) };
  },
  get h1() {
    return { fontSize: 32, lineHeight: scaledLineHeight(40), letterSpacing: -0.6 };
  },
  get h2() {
    return { fontSize: 24, lineHeight: scaledLineHeight(32), letterSpacing: -0.4 };
  },
  get h3() {
    return { fontSize: 20, lineHeight: scaledLineHeight(28), letterSpacing: -0.2 };
  },
  get numeric() {
    return { fontSize: 16, lineHeight: scaledLineHeight(24) };
  },
  get numericLarge() {
    return { fontSize: 32, lineHeight: scaledLineHeight(40), letterSpacing: -0.4 };
  },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  weight?: 'regular' | 'medium' | 'semibold';
  // No 'fgSubtle' — this component always renders text, and fgSubtle fails
  // AA 4.5:1 as a text color in both palettes (canon § Theming). Use
  // 'fgMuted' for de-emphasized text.
  color?: 'fg' | 'fgMuted' | 'fgOnInk' | 'danger' | 'success' | 'appAccent';
  mono?: boolean;
}

export function Text({ variant = 'body', weight, color, mono, style, ...rest }: TextProps) {
  const { c } = useTheme();
  const computedColor =
    color === 'fgMuted' ? c.fgMuted :
    color === 'fgOnInk' ? c.inkButtonText :
    color === 'danger' ? c.danger :
    color === 'success' ? c.success :
    color === 'appAccent' ? c.appAccent :
    c.fg;

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
