import React, { useMemo } from 'react';
import { Pressable, View, FlatList } from 'react-native';
import { useTheme, space } from '../theme';
import { Text } from './Text';
import { Hairline } from './Hairline';
import { CategoryIcon } from './CategoryIcon';
import { formatAmount } from '../lib/money';
import { formatRowDate } from '../lib/period';
import { t } from '../i18n';
import type { Transaction, Category, Account } from '../data/types';

interface Props {
  transactions: Transaction[];
  categories: Map<string, Category>;
  accounts: Map<string, Account>;
  currencyCode: string;
  showAccount?: boolean;
  onPressRow?: (tx: Transaction) => void;
  emptyText?: string;
  ListHeaderComponent?: React.ReactElement | null;
}

interface Section {
  type: 'header' | 'row';
  key: string;
  date?: string;
  totalMinor?: number;
  tx?: Transaction;
}

export function TransactionList({
  transactions,
  categories,
  accounts,
  currencyCode,
  showAccount = false,
  onPressRow,
  emptyText,
  ListHeaderComponent,
}: Props) {
  const { c } = useTheme();

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    let lastDate: string | null = null;
    let dayTotal = 0;
    let dayHeaderIdx = -1;
    for (const t of transactions) {
      if (t.occurredAt !== lastDate) {
        if (dayHeaderIdx >= 0) out[dayHeaderIdx].totalMinor = dayTotal;
        dayHeaderIdx = out.length;
        dayTotal = 0;
        out.push({ type: 'header', key: `h-${t.occurredAt}`, date: t.occurredAt, totalMinor: 0 });
        lastDate = t.occurredAt;
      }
      dayTotal += t.kind === 'income' ? t.amountMinor : -t.amountMinor;
      out.push({ type: 'row', key: t.id, tx: t });
    }
    if (dayHeaderIdx >= 0) out[dayHeaderIdx].totalMinor = dayTotal;
    return out;
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <View>
        {ListHeaderComponent}
        <View style={{ padding: space.s7, alignItems: 'center' }}>
          <Text color="fgMuted">{emptyText ?? t('tx.listEmpty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(s) => s.key}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ paddingBottom: space.s9 }}
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return (
            <View
              style={{
                paddingHorizontal: space.s5,
                paddingTop: space.s5,
                paddingBottom: space.s2,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="caption" color="fgMuted" weight="medium">
                {formatRowDate(item.date!)}
              </Text>
              <Text variant="caption" color="fgMuted" mono>
                {formatAmount(item.totalMinor!, currencyCode, { sign: (item.totalMinor ?? 0) > 0 })}
              </Text>
            </View>
          );
        }
        const tx = item.tx!;
        const cat = categories.get(tx.categoryId);
        const acc = accounts.get(tx.accountId);
        return (
          <View>
            <Pressable
              onPress={onPressRow ? () => onPressRow(tx) : undefined}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: space.s5,
                paddingVertical: space.s4,
                gap: space.s4,
                backgroundColor: pressed ? c.bgSubtle : 'transparent',
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c.bgSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CategoryIcon name={cat?.icon ?? 'circle'} color={c.fg} size={18} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text>{cat?.name ?? t('tx.uncategorized')}</Text>
                {tx.note || (showAccount && acc) ? (
                  <Text variant="bodySubtle" color="fgMuted" numberOfLines={1}>
                    {[tx.note, showAccount ? acc?.name : null].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
              <Text
                mono
                weight="medium"
                style={{ color: tx.kind === 'income' ? c.success : c.fg }}
              >
                {tx.kind === 'income' ? '+' : '−'}
                {formatAmount(tx.amountMinor, currencyCode)}
              </Text>
            </Pressable>
            <Hairline style={{ marginLeft: space.s5 + 36 + space.s4 }} />
          </View>
        );
      }}
    />
  );
}
