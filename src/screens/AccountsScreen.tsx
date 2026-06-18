import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Archive, ArchiveRestore, X } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { TopBar, TopBarButton } from '../components/TopBar';
import { Text } from '../components/Text';
import { Hairline } from '../components/Hairline';
import { Button } from '../components/Button';
import { useTheme, space, radius } from '../theme';
import { listAccountsWithBalance, createAccount, updateAccount, type AccountWithBalance } from '../data/accounts';
import { getSettings } from '../data/settings';
import { formatAmount, parseAmount } from '../lib/money';
import { t } from '../i18n';

export function AccountsScreen() {
  const navigation = useNavigation();
  const { c } = useTheme();

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AccountWithBalance | null>(null);

  const reload = useCallback(async () => {
    const [accs, settings] = await Promise.all([
      listAccountsWithBalance({ includeArchived: true }),
      getSettings(),
    ]);
    setAccounts(accs);
    setCurrency(settings.currencyCode);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (a: AccountWithBalance) => {
    setEditing(a);
    setEditorOpen(true);
  };

  return (
    <Screen>
      <TopBar
        title={t('accounts.title')}
        left={
          <TopBarButton onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
        right={
          <TopBarButton onPress={openNew}>
            <Plus size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
      />
      <Hairline />
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View>
            <Pressable
              onPress={() => openEdit(item)}
              style={({ pressed }) => ({
                paddingHorizontal: space.s5,
                paddingVertical: space.s4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.s4,
                opacity: item.archived ? 0.5 : 1,
                backgroundColor: pressed ? c.bgSubtle : 'transparent',
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text>{item.name}</Text>
                <Text variant="bodySubtle" color="fgMuted">
                  {item.archived ? t('accounts.archivedPrefix') : ''}
                  {formatAmount(item.balanceMinor, currency, { sign: item.balanceMinor > 0 })}
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={async () => {
                  await updateAccount(item.id, { archived: !item.archived });
                  reload();
                }}
              >
                {item.archived ? (
                  <ArchiveRestore size={18} color={c.fgMuted} strokeWidth={1.5} />
                ) : (
                  <Archive size={18} color={c.fgMuted} strokeWidth={1.5} />
                )}
              </Pressable>
            </Pressable>
            <Hairline style={{ marginLeft: space.s5 }} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: space.s7, alignItems: 'center' }}>
            <Text color="fgMuted">{t('accounts.empty')}</Text>
          </View>
        }
      />

      <AccountEditor
        visible={editorOpen}
        editing={editing}
        currency={currency}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false);
          reload();
        }}
      />
    </Screen>
  );
}

function AccountEditor({
  visible,
  editing,
  currency,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing: AccountWithBalance | null;
  currency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [startingBalance, setStartingBalance] = useState('');

  React.useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '');
      const minor = editing?.startingBalanceMinor ?? 0;
      if (minor === 0) {
        setStartingBalance('');
      } else {
        setStartingBalance(formatPlain(minor, currency));
      }
    }
  }, [visible, editing, currency]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('common.nameRequired'));
      return;
    }
    const startMinor = startingBalance.trim() === '' ? 0 : (parseAmount(startingBalance, currency) ?? 0);
    if (editing) {
      await updateAccount(editing.id, { name: trimmed, startingBalanceMinor: startMinor });
    } else {
      await createAccount({ name: trimmed, startingBalanceMinor: startMinor });
    }
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <TopBar
          title={editing ? t('accounts.editTitle') : t('accounts.newTitle')}
          left={
            <TopBarButton onPress={onClose}>
              <X size={22} color={c.fg} strokeWidth={1.5} />
            </TopBarButton>
          }
        />
        <Hairline />
        <View style={{ padding: space.s5, gap: space.s5 }}>
          <View>
            <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
              {t('common.name')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('accounts.namePlaceholder')}
              placeholderTextColor={c.fgSubtle}
              autoFocus
              style={inputStyle(c, radius, space)}
            />
          </View>
          <View>
            <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
              {t('accounts.startingBalance')}
            </Text>
            <TextInput
              value={startingBalance}
              onChangeText={setStartingBalance}
              keyboardType="decimal-pad"
              placeholder={t('accounts.startingBalancePlaceholder')}
              placeholderTextColor={c.fgSubtle}
              style={inputStyle(c, radius, space)}
            />
            <Text variant="caption" color="fgSubtle" style={{ marginTop: space.s2 }}>
              {t('accounts.startingBalanceHint')}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <View
          style={{
            paddingHorizontal: space.s5,
            paddingTop: space.s3,
            paddingBottom: space.s5,
            borderTopWidth: 1,
            borderColor: c.hairline,
          }}
        >
          <Button label={editing ? t('common.saveChanges') : t('accounts.add')} onPress={handleSave} fullWidth />
        </View>
      </Screen>
    </Modal>
  );
}

function inputStyle(
  colors: { hairline: string; fg: string; bgElevated: string },
  radius: { md: number },
  space: { s4: number }
) {
  return {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space.s4,
    paddingVertical: space.s4,
    color: colors.fg,
    fontSize: 16,
    backgroundColor: colors.bgElevated,
  } as const;
}

function formatPlain(minor: number, currency: string): string {
  const decimals = currency === 'JPY' || currency === 'KRW' ? 0 : 2;
  const unit = Math.pow(10, decimals);
  const major = Math.floor(Math.abs(minor) / unit);
  const frac = Math.abs(minor) % unit;
  const sign = minor < 0 ? '-' : '';
  return decimals > 0 ? `${sign}${major}.${frac.toString().padStart(decimals, '0')}` : `${sign}${major}`;
}
