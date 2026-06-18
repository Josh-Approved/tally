import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Trash2, ChevronDown } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { TopBar, TopBarButton } from '../components/TopBar';
import { Text } from '../components/Text';
import { Hairline } from '../components/Hairline';
import { Keypad } from '../components/Keypad';
import { CategoryGrid } from '../components/CategoryGrid';
import { useTheme, space, target, radius } from '../theme';
import { listCategories } from '../data/categories';
import { listAccounts } from '../data/accounts';
import { getSettings } from '../data/settings';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '../data/transactions';
import { todayIso, formatRowDate } from '../lib/period';
import { t } from '../i18n';
import { decimalsForCurrency, formatAmount, parseAmount, minorPerUnit } from '../lib/money';
import type { RootStackParamList } from '../navigation/types';
import type { Account, Category, TxKind } from '../data/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddTransaction'>;
type Route = RouteProp<RootStackParamList, 'AddTransaction'>;

export function AddTransactionSheet() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { c } = useTheme();

  const [kind, setKind] = useState<TxKind>(route.params.kind);
  const [amountInput, setAmountInput] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState<string>(todayIso());
  const [note, setNote] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(route.params.transactionId ?? null);

  const visibleCategories = useMemo(() => categories.filter((c) => c.kind === kind && !c.hidden), [categories, kind]);

  useEffect(() => {
    (async () => {
      const [cats, accs, settings] = await Promise.all([listCategories({ includeHidden: true }), listAccounts(), getSettings()]);
      setCategories(cats);
      setAccounts(accs);
      setCurrency(settings.currencyCode);

      if (route.params.transactionId) {
        const all = await listTransactions();
        const tx = all.find((t) => t.id === route.params.transactionId);
        if (tx) {
          setKind(tx.kind);
          setCategoryId(tx.categoryId);
          setAccountId(tx.accountId);
          setOccurredAt(tx.occurredAt);
          setNote(tx.note ?? '');
          const decimals = decimalsForCurrency(settings.currencyCode);
          const unit = minorPerUnit(settings.currencyCode);
          const major = Math.floor(tx.amountMinor / unit);
          const frac = tx.amountMinor % unit;
          setAmountInput(decimals > 0 ? `${major}.${frac.toString().padStart(decimals, '0')}` : `${major}`);
          setEditingId(tx.id);
        }
      } else {
        setAccountId((cur) => cur ?? settings.defaultAccountId ?? accs[0]?.id ?? null);
        if (settings.defaultCategoryId && cats.find((c) => c.id === settings.defaultCategoryId && c.kind === route.params.kind)) {
          setCategoryId(settings.defaultCategoryId);
        }
      }
    })();
  }, [route.params.transactionId, route.params.kind]);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        setAmountInput((s) => s.slice(0, -1));
        return;
      }
      if (key === '.') {
        if (amountInput.includes('.')) return;
        setAmountInput((s) => (s === '' ? '0.' : s + '.'));
        return;
      }
      const decimals = decimalsForCurrency(currency);
      const dot = amountInput.indexOf('.');
      if (dot >= 0 && amountInput.length - dot - 1 >= decimals) return;
      if (amountInput === '0' && key !== '.') {
        setAmountInput(key);
        return;
      }
      if (amountInput.length >= 12) return;
      setAmountInput((s) => s + key);
    },
    [amountInput, currency]
  );

  const amountMinor = useMemo(() => parseAmount(amountInput || '0', currency) ?? 0, [amountInput, currency]);
  const formattedAmount = formatAmount(amountMinor, currency);
  const canSave = amountMinor > 0 && categoryId && accountId;

  const handleSave = async () => {
    if (!canSave || !categoryId || !accountId) return;
    if (editingId) {
      await updateTransaction(editingId, { kind, amountMinor, accountId, categoryId, occurredAt, note: note.trim() || null });
    } else {
      await createTransaction({ kind, amountMinor, accountId, categoryId, occurredAt, note: note.trim() || null });
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert(t('tx.deleteTitle'), t('tx.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(editingId);
          navigation.goBack();
        },
      },
    ]);
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <Screen>
      <TopBar
        title={editingId ? t('tx.editTitle') : kind === 'expense' ? t('common.expense') : t('common.income')}
        left={
          <TopBarButton onPress={() => navigation.goBack()}>
            <X size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
        right={
          editingId ? (
            <TopBarButton onPress={handleDelete}>
              <Trash2 size={20} color={c.danger} strokeWidth={1.5} />
            </TopBarButton>
          ) : null
        }
      />
      <Hairline />

      <ScrollView
        contentContainerStyle={{ paddingBottom: space.s5 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', paddingVertical: space.s7, paddingHorizontal: space.s5 }}>
          <Text variant="caption" color="fgMuted">{kind === 'expense' ? t('tx.spent') : t('tx.received')}</Text>
          <Text mono weight="semibold" style={{ fontSize: 44, lineHeight: 52, marginTop: space.s2 }}>
            {kind === 'expense' ? '−' : '+'}{formattedAmount}
          </Text>
        </View>

        <Keypad onPress={handleKey} />

        <View style={{ paddingHorizontal: space.s5, paddingTop: space.s5 }}>
          <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
            {t('tx.category')}
          </Text>
        </View>
        <CategoryGrid categories={visibleCategories} selectedId={categoryId} onSelect={setCategoryId} />

        {accounts.length > 1 ? (
          <View style={{ paddingHorizontal: space.s5, paddingTop: space.s5 }}>
            <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
              {t('tx.account')}
            </Text>
            <Pressable
              onPress={() => setAccountSheetOpen((s) => !s)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: c.hairline,
                borderRadius: radius.md,
                paddingHorizontal: space.s4,
                paddingVertical: space.s4,
                backgroundColor: c.bgElevated,
              }}
            >
              <Text>{selectedAccount?.name ?? t('common.choose')}</Text>
              <ChevronDown size={18} color={c.fgMuted} strokeWidth={1.5} />
            </Pressable>
            {accountSheetOpen ? (
              <View
                style={{
                  marginTop: space.s2,
                  borderWidth: 1,
                  borderColor: c.hairline,
                  borderRadius: radius.md,
                  backgroundColor: c.bgElevated,
                  overflow: 'hidden',
                }}
              >
                {accounts.map((a, i) => (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      setAccountId(a.id);
                      setAccountSheetOpen(false);
                    }}
                    style={{
                      paddingHorizontal: space.s4,
                      paddingVertical: space.s4,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderColor: c.hairline,
                      backgroundColor: a.id === accountId ? c.bgSubtle : 'transparent',
                    }}
                  >
                    <Text>{a.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: space.s5, paddingTop: space.s5 }}>
          <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
            {t('tx.date')}
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: c.hairline,
              borderRadius: radius.md,
              paddingHorizontal: space.s4,
              paddingVertical: space.s4,
              backgroundColor: c.bgElevated,
            }}
          >
            <Text>{formatRowDate(occurredAt)}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: space.s5, paddingTop: space.s5 }}>
          <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
            {t('tx.noteOptional')}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('tx.notePlaceholder')}
            placeholderTextColor={c.fgSubtle}
            style={{
              borderWidth: 1,
              borderColor: c.hairline,
              borderRadius: radius.md,
              paddingHorizontal: space.s4,
              paddingVertical: space.s4,
              backgroundColor: c.bgElevated,
              color: c.fg,
              fontSize: 16,
            }}
          />
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: space.s5,
          paddingTop: space.s3,
          paddingBottom: space.s5,
          borderTopWidth: 1,
          borderColor: c.hairline,
          backgroundColor: c.bg,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => ({
            height: target.min + 8,
            borderRadius: 999,
            backgroundColor: canSave ? c.fg : c.bgSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: canSave ? c.inkButtonText : c.fgSubtle }} weight="medium">
            {editingId ? t('common.saveChanges') : t('common.save')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
