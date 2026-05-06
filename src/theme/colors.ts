// Mirrors josh-approved-factory/skills/josh-approved-design-system/colors_and_type.css.
// Replace with the factory-synced module once `sync.mjs design-system-native` emits one.
//
// Tally accent: dusty teal #3F7D7D — declared in CLAUDE.md § Brand accent.

const PALETTE = {
  ink1000: '#0E0E0F',
  ink900: '#1A1A1C',
  ink700: '#3D3D42',
  ink500: '#6B6B72',
  ink300: '#9A9AA0',
  ink200: '#C8C8CC',
  ink100: '#E5E5E2',
  ink50: '#F2F2EE',
  paper: '#FAFAF7',
  pureWhite: '#FFFFFF',

  green700: '#166534',
  green600: '#1F8A4C',
  green500: '#2EA866',
  green100: '#DCFCE7',

  amber700: '#92400E',
  amber600: '#B45309',
  amber100: '#FEF3C7',

  red700: '#991B1B',
  red600: '#B91C1C',
  red100: '#FEE2E2',

  slate700: '#334155',
  slate600: '#475569',
  slate100: '#E2E8F0',
} as const;

const APP_ACCENT = '#3F7D7D';
const APP_ACCENT_BG = '#E5EDED';
const APP_ACCENT_DARK = '#7BB0B0';
const APP_ACCENT_BG_DARK = 'rgba(123, 176, 176, 0.14)';

type ColorMap = {
  bg: string; bgElevated: string; bgSubtle: string; bgScrim: string;
  fg: string; fgMuted: string; fgSubtle: string; fgOnInk: string; fgOnAccent: string;
  hairline: string; hairlineStrong: string;
  accent: string; accentHover: string; accentBg: string;
  appAccent: string; appAccentBg: string;
  success: string; successBg: string;
  warning: string; warningBg: string;
  danger: string; dangerBg: string;
  info: string; infoBg: string;
  focusRing: string;
};

export const lightColors: ColorMap = {
  bg: PALETTE.paper,
  bgElevated: PALETTE.pureWhite,
  bgSubtle: PALETTE.ink50,
  bgScrim: 'rgba(14, 14, 15, 0.5)',

  fg: PALETTE.ink1000,
  fgMuted: PALETTE.ink500,
  fgSubtle: PALETTE.ink300,
  fgOnInk: PALETTE.paper,
  fgOnAccent: PALETTE.paper,

  hairline: PALETTE.ink100,
  hairlineStrong: PALETTE.ink200,

  accent: PALETTE.green600,
  accentHover: PALETTE.green700,
  accentBg: PALETTE.green100,

  appAccent: APP_ACCENT,
  appAccentBg: APP_ACCENT_BG,

  success: PALETTE.green600,
  successBg: PALETTE.green100,
  warning: PALETTE.amber600,
  warningBg: PALETTE.amber100,
  danger: PALETTE.red600,
  dangerBg: PALETTE.red100,
  info: PALETTE.slate600,
  infoBg: PALETTE.slate100,

  focusRing: PALETTE.green600,
};

export const darkColors: ColorMap = {
  bg: '#0B0B0C',
  bgElevated: '#131315',
  bgSubtle: '#1A1A1C',
  bgScrim: 'rgba(0, 0, 0, 0.6)',

  fg: '#F5F5F2',
  fgMuted: '#A0A0A6',
  fgSubtle: '#6B6B72',
  fgOnInk: '#F5F5F2',
  fgOnAccent: '#FFFFFF',

  hairline: '#26262A',
  hairlineStrong: '#3D3D42',

  accent: PALETTE.green500,
  accentHover: PALETTE.green600,
  accentBg: 'rgba(46, 168, 102, 0.15)',

  appAccent: APP_ACCENT_DARK,
  appAccentBg: APP_ACCENT_BG_DARK,

  success: PALETTE.green500,
  successBg: 'rgba(46, 168, 102, 0.15)',
  warning: PALETTE.amber600,
  warningBg: 'rgba(180, 83, 9, 0.18)',
  danger: PALETTE.red600,
  dangerBg: 'rgba(185, 28, 28, 0.18)',
  info: PALETTE.slate600,
  infoBg: 'rgba(71, 85, 105, 0.22)',

  focusRing: PALETTE.green500,
};

export type ThemeColors = ColorMap;
export type ColorToken = keyof ColorMap;
