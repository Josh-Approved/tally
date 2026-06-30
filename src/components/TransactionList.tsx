import React, { useMemo } from 'react';
import {
  Pressable,
  View,
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  GestureDetector,
  type ComposedGesture,
} from 'react-native-gesture-handler';
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
  ListFooterComponent?: React.ReactElement | null;
  /** Pull-to-reveal footer wiring (see usePullRevealFooter): scroll handler +
   *  bounce flag drive the bottom-overscroll wordmark reveal on iOS. */
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  alwaysBounceVertical?: boolean;
  /** Pull-to-reveal gesture (Android over-pull) — wraps the list when set. */
  gesture?: ComposedGesture;
  /** onLayout for the list viewport; feeds at-bottom detection. */
  onScrollViewLayout?: (e: LayoutChangeEvent) => void;
  /** onContentSizeChange for the list; feeds at-bottom detection on short lists. */
  onContentSizeChange?: (w: number, h: number) => void;
  /** onLayout for the footer holder; feeds the pull-reveal footerHeight. */
  onFooterLayout?: (e: LayoutChangeEvent) => void;
  /** Extra contentContainerStyle merged over the list default (e.g. flexGrow:1
   *  so a short list fills the screen and the footer rests at the bottom). */
  contentContainerStyle?: StyleProp<ViewStyle>;
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
  ListFooterComponent,
  onScroll,
  alwaysBounceVertical,
  gesture,
  onScrollViewLayout,
  onContentSizeChange,
  onFooterLayout,
  contentContainerStyle,
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
      <View style={{ flex: 1 }}>
        {ListHeaderComponent}
        <View style={{ padding: space.s7, alignItems: 'center' }}>
          <Text color="fgMuted">{emptyText ?? t('tx.listEmpty')}</Text>
        </View>
        <View style={{ marginTop: 'auto' }} onLayout={onFooterLayout}>
          {ListFooterComponent}
        </View>
      </View>
    );
  }

  const list = (
    <FlatList
      data={sections}
      keyExtractor={(s) => s.key}
      onScroll={onScroll}
      scrollEventThrottle={16}
      alwaysBounceVertical={alwaysBounceVertical}
      overScrollMode={alwaysBounceVertical ? 'never' : 'auto'}
      onLayout={onScrollViewLayout}
      onContentSizeChange={onContentSizeChange}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        <View style={{ marginTop: 'auto' }} onLayout={onFooterLayout}>
          {ListFooterComponent}
        </View>
      }
      contentContainerStyle={[{ flexGrow: 1, paddingBottom: space.s5 }, contentContainerStyle]}
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
  // Wrap in the pull-to-reveal gesture when wired (Android over-pull); the pan
  // recognises simultaneously with the list's own scroll.
  return gesture ? <GestureDetector gesture={gesture}>{list}</GestureDetector> : list;
}
