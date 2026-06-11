import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View, type ListRenderItemInfo } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Settings as SettingsIcon, Search as SearchIcon, Plus, Minus } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { TopBar, TopBarButton } from '../components/TopBar';
import { PeriodSwitcher } from '../components/PeriodSwitcher';
import { PeriodHeader } from '../components/PeriodHeader';
import { AccountPills, type AccountScope } from '../components/AccountPills';
import { CategoryDonut, type DonutSegment } from '../components/CategoryDonut';
import { TotalsRow } from '../components/TotalsRow';
import { TransactionList } from '../components/TransactionList';
import { Hairline } from '../components/Hairline';
import { Text } from '../components/Text';
import { useTheme, space, target } from '../theme';
import { Pressable } from 'react-native';
import { listAccounts } from '../data/accounts';
import { listCategories } from '../data/categories';
import { listTransactions, periodTotals, categoryTotals } from '../data/transactions';
import { getSettings } from '../data/settings';
import { materializeRecurring } from '../data/recurring';
import { periodRange, shiftPeriod, type PeriodKind } from '../lib/period';
import type { RootStackParamList } from '../navigation/types';
import type { Account, Category, Transaction } from '../data/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { c } = useTheme();

  const [period, setPeriod] = useState<PeriodKind>('month');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [scope, setScope] = useState<AccountScope>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [net, setNet] = useState(0);
  const [donut, setDonut] = useState<DonutSegment[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [recurringNotice, setRecurringNotice] = useState<number | null>(null);

  const range = useMemo(() => periodRange(period, anchor), [period, anchor]);

  const reload = useCallback(async () => {
    const [acc, cat, settings] = await Promise.all([listAccounts(), listCategories({ includeHidden: true }), getSettings()]);
    setAccounts(acc);
    setCategories(cat);
    setCurrency(settings.currencyCode);

    const filter = { startIso: range.startIso, endIso: range.endIso, accountId: scope ?? undefined };
    const [txs, totals, byCat] = await Promise.all([
      listTransactions(filter),
      periodTotals(filter),
      categoryTotals({ ...filter, kind: 'expense' }),
    ]);
    setTransactions(txs);
    setIncome(totals.incomeMinor);
    setExpense(totals.expenseMinor);
    setNet(totals.netMinor);
    setDonut(byCat.map((b) => ({ key: b.categoryId, valueMinor: b.totalMinor })));
  }, [range.startIso, range.endIso, scope]);

  useEffect(() => {
    (async () => {
      const created = await materializeRecurring();
      if (created > 0) setRecurringNotice(created);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const handlePressRow = (tx: Transaction) => {
    navigation.navigate('AddTransaction', { kind: tx.kind, transactionId: tx.id });
  };

  return (
    <Screen>
      <TopBar
        title="Tally"
        left={
          <TopBarButton onPress={() => navigation.navigate('Settings')}>
            <SettingsIcon size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
        right={
          <TopBarButton onPress={() => Alert.alert('Search', 'Coming soon.')}>
            <SearchIcon size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
      />
      <Hairline />
      <View style={{ paddingHorizontal: space.s5, paddingTop: space.s4, paddingBottom: space.s3 }}>
        <PeriodSwitcher value={period} onChange={setPeriod} />
      </View>
      <PeriodHeader
        label={range.label}
        onPrev={() => setAnchor((a) => shiftPeriod(period, a, -1))}
        onNext={() => setAnchor((a) => shiftPeriod(period, a, 1))}
        onResetToToday={() => setAnchor(new Date())}
      />
      {accounts.length > 1 ? (
        <>
          <Hairline />
          <AccountPills accounts={accounts} value={scope} onChange={setScope} />
        </>
      ) : null}
      <Hairline />

      {recurringNotice !== null ? (
        <View
          style={{
            paddingHorizontal: space.s5,
            paddingVertical: space.s3,
            backgroundColor: c.bgSubtle,
            borderBottomWidth: 1,
            borderColor: c.hairline,
          }}
        >
          <Text variant="bodySubtle" color="fgMuted">
            Added {recurringNotice} recurring {recurringNotice === 1 ? 'transaction' : 'transactions'}.
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <TransactionList
          transactions={transactions}
          categories={categoriesMap}
          accounts={accountsMap}
          currencyCode={currency}
          showAccount={scope === null && accounts.length > 1}
          onPressRow={handlePressRow}
          ListHeaderComponent={
            <View style={{ alignItems: 'center', paddingVertical: space.s6 }}>
              <CategoryDonut
                size={240}
                segments={donut}
                totalLabelMinor={expense}
                currencyCode={currency}
                centerSubLabel={expense > 0 ? 'Spent' : transactions.length === 0 ? 'No transactions yet' : 'No expenses'}
              />
              <View style={{ height: space.s5 }} />
              <TotalsRow
                incomeMinor={income}
                expenseMinor={expense}
                netMinor={net}
                currencyCode={currency}
              />
            </View>
          }
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: space.s5,
          paddingTop: space.s3,
          paddingBottom: space.s5,
          borderTopWidth: 1,
          borderColor: c.hairline,
          backgroundColor: c.bg,
          gap: space.s4,
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('AddTransaction', { kind: 'expense' })}
          style={({ pressed }) => ({
            flex: 1,
            height: target.min + 8,
            borderRadius: 999,
            backgroundColor: c.fg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: space.s2,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Minus size={20} color={c.fgOnInk} strokeWidth={2} />
          <Text style={{ color: c.fgOnInk }} weight="medium">Expense</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('AddTransaction', { kind: 'income' })}
          style={({ pressed }) => ({
            flex: 1,
            height: target.min + 8,
            borderRadius: 999,
            backgroundColor: c.bgElevated,
            borderWidth: 1,
            borderColor: c.fg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: space.s2,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Plus size={20} color={c.fg} strokeWidth={2} />
          <Text weight="medium">Income</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
