import React from 'react';
import { View } from 'react-native';
import { useTheme, space } from '../theme';
import { Text } from './Text';
import { Hairline } from './Hairline';
import { formatAmount } from '../lib/money';
import { t } from '../i18n';

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
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: space.s5,
        paddingVertical: space.s4,
        backgroundColor: c.bgElevated,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: c.hairline,
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">{t('totals.income')}</Text>
        <Text mono weight="medium">{formatAmount(incomeMinor, currencyCode)}</Text>
      </View>
      <Hairline vertical />
      <View style={{ flex: 1, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">{t('totals.expenses')}</Text>
        <Text mono weight="medium">{formatAmount(expenseMinor, currencyCode)}</Text>
      </View>
      <Hairline vertical />
      <View style={{ flex: 1, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">{t('totals.net')}</Text>
        <Text
          mono
          weight="medium"
          style={{ color: netMinor < 0 ? c.danger : netMinor > 0 ? c.success : c.fg }}
        >
          {formatAmount(netMinor, currencyCode, { sign: netMinor > 0 })}
        </Text>
      </View>
    </View>
  );
}
