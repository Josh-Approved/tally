import React from 'react';
import { PixelRatio, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useTheme, space, hairline } from '../theme';
import { Text } from './Text';
import { Hairline } from './Hairline';
import { fitMonoFontSize, formatAmount } from '../lib/money';
import { t } from '../i18n';

const BASE_FONT = 16;
const MIN_FONT = 10;

/**
 * Width available to ONE total, given the row's measured width: three equal
 * columns inside the row's horizontal padding, minus the two vertical
 * hairlines, minus a small gutter so neighbouring figures never touch.
 * Exported for the unit test — this is the arithmetic that keeps a total from
 * wrapping mid-number.
 */
export function totalsColumnWidth(rowWidth: number): number {
  const inner = rowWidth - 2 * space.s5 - 2 * hairline;
  return Math.max(0, inner / 3 - space.s2);
}

/**
 * Income / Expenses / Net. Every figure is one line, shrink-to-fit.
 *
 * Defect tally-20260801-1: all three totals wrapped mid-number ("USD3,200.0" /
 * "0") because the figures were free to wrap inside a fixed third of the row.
 * The width fix is arithmetic rather than `adjustsFontSizeToFit`, which is
 * iOS-only (so Android would keep overflowing) and, per the FundingFooter note,
 * misbehaves for a Text whose width is not definite.
 */
export function TotalsRow({
  incomeMinor,
  expenseMinor,
  netMinor,
  currencyCode,
}: {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  currencyCode: string;
}) {
  const { c } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  // Window width is the first-frame estimate; onLayout replaces it with the
  // row's real width (the row may sit inside a padded parent).
  const [rowWidth, setRowWidth] = React.useState(windowWidth);
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setRowWidth((prev) => (Math.abs(prev - w) > 0.5 ? w : prev));
  }, []);

  const fontScale = PixelRatio.getFontScale() || 1;
  const colWidth = totalsColumnWidth(rowWidth) / fontScale;

  const income = formatAmount(incomeMinor, currencyCode);
  const expense = formatAmount(expenseMinor, currencyCode);
  const net = formatAmount(netMinor, currencyCode, { sign: netMinor > 0 });

  // One size for all three columns — the widest figure sets it, so the row
  // stays visually even instead of stair-stepping.
  const widest = [income, expense, net].reduce((a, b) => (b.length > a.length ? b : a), '');
  const fontSize = fitMonoFontSize(widest, colWidth, BASE_FONT, MIN_FONT);
  const figureStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.5),
    alignSelf: 'stretch' as const,
    textAlign: 'center' as const,
  };

  return (
    <View
      onLayout={onLayout}
      style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        paddingHorizontal: space.s5,
        paddingVertical: space.s4,
        backgroundColor: c.bgElevated,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: c.hairline,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">{t('totals.income')}</Text>
        <Text mono weight="medium" numberOfLines={1} ellipsizeMode="tail" style={figureStyle}>
          {income}
        </Text>
      </View>
      <Hairline vertical />
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">{t('totals.expenses')}</Text>
        <Text mono weight="medium" numberOfLines={1} ellipsizeMode="tail" style={figureStyle}>
          {expense}
        </Text>
      </View>
      <Hairline vertical />
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">{t('totals.net')}</Text>
        <Text
          mono
          weight="medium"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            figureStyle,
            { color: netMinor < 0 ? c.danger : netMinor > 0 ? c.success : c.fg },
          ]}
        >
          {net}
        </Text>
      </View>
    </View>
  );
}
