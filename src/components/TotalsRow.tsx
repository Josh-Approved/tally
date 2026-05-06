import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Hairline } from './Hairline';
import { formatAmount } from '../lib/money';

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
  const { colors, space } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: space.s5,
        paddingVertical: space.s4,
        backgroundColor: colors.bgElevated,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.hairline,
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">Income</Text>
        <Text mono weight="medium">{formatAmount(incomeMinor, currencyCode)}</Text>
      </View>
      <Hairline vertical />
      <View style={{ flex: 1, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">Expenses</Text>
        <Text mono weight="medium">{formatAmount(expenseMinor, currencyCode)}</Text>
      </View>
      <Hairline vertical />
      <View style={{ flex: 1, alignItems: 'center', gap: space.s1 }}>
        <Text variant="caption" color="fgMuted">Net</Text>
        <Text
          mono
          weight="medium"
          style={{ color: netMinor < 0 ? colors.danger : netMinor > 0 ? colors.success : colors.fg }}
        >
          {formatAmount(netMinor, currencyCode, { sign: netMinor > 0 })}
        </Text>
      </View>
    </View>
  );
}
