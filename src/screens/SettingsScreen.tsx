import React, { useCallback, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ChevronRight, X, Check } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { TopBar, TopBarButton } from '../components/TopBar';
import { Text } from '../components/Text';
import { Hairline } from '../components/Hairline';
import { useTheme, space } from '../theme';
import { getSettings, updateSettings } from '../data/settings';
import { listAccounts } from '../data/accounts';
import { listCategories } from '../data/categories';
import { SUPPORTED_CURRENCIES } from '../lib/currency';
import type { RootStackParamList } from '../navigation/types';
import type { Account, Category, Settings, ThemePref } from '../data/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { c } = useTheme();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [picker, setPicker] = useState<null | 'currency' | 'theme' | 'defaultAccount' | 'defaultCategory'>(null);

  const reload = useCallback(async () => {
    const [s, accs, cats] = await Promise.all([getSettings(), listAccounts(), listCategories({ includeHidden: false })]);
    setSettings(s);
    setAccounts(accs);
    setCategories(cats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const apply = async (patch: Partial<Settings>) => {
    await updateSettings(patch);
    setSettings((s) => (s ? { ...s, ...patch } : s));
  };

  if (!settings) {
    return <Screen><View /></Screen>;
  }

  const defaultAccountName = accounts.find((a) => a.id === settings.defaultAccountId)?.name ?? 'None';
  const defaultCategoryName = categories.find((c) => c.id === settings.defaultCategoryId)?.name ?? 'None';

  return (
    <Screen>
      <TopBar
        title="Settings"
        left={
          <TopBarButton onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
      />
      <Hairline />
      <ScrollView contentContainerStyle={{ paddingBottom: space.s8 }}>
        <SectionHeader title="General" />
        <Row label="Currency" value={settings.currencyCode} onPress={() => setPicker('currency')} />
        <Row label="Theme" value={labelFor(settings.theme, THEME_OPTIONS)} onPress={() => setPicker('theme')} />

        <SectionHeader title="Defaults" />
        <Row label="Default account" value={defaultAccountName} onPress={() => setPicker('defaultAccount')} />
        <Row label="Default category" value={defaultCategoryName} onPress={() => setPicker('defaultCategory')} />

        <SectionHeader title="Library" />
        <Row label="Categories" onPress={() => navigation.navigate('Categories')} />
        <Row label="Accounts" onPress={() => navigation.navigate('Accounts')} />

        <SectionHeader title="About" />
        <View style={{ paddingHorizontal: space.s5, paddingVertical: space.s4, gap: space.s3 }}>
          <Text>
            Tally — an expense tracker. No paywall. No ads. No tracking. No accounts. Your data stays with you.
          </Text>
          <Text color="fgMuted" variant="bodySubtle">
            Made independently. The code is on GitHub.
          </Text>
        </View>
        <Row label="Support this app" onPress={() => Linking.openURL('https://buymeacoffee.com/jtysonwilliams')} />
        <Row label="Send feedback" onPress={() => Linking.openURL('mailto:feedback@joshapproved.com')} />
        <Row label="Source code" onPress={() => Linking.openURL('https://github.com/Josh-Approved/tally')} />
        <Row label="Privacy" onPress={() => Linking.openURL('https://github.com/Josh-Approved/tally/blob/main/PRIVACY.md')} />
      </ScrollView>

      <PickerModal
        title="Currency"
        visible={picker === 'currency'}
        onClose={() => setPicker(null)}
        options={SUPPORTED_CURRENCIES.map((c) => ({ id: c, label: c }))}
        selectedId={settings.currencyCode}
        onSelect={(v) => apply({ currencyCode: v })}
      />
      <PickerModal
        title="Theme"
        visible={picker === 'theme'}
        onClose={() => setPicker(null)}
        options={THEME_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
        selectedId={settings.theme}
        onSelect={(v) => apply({ theme: v as ThemePref })}
      />
      <PickerModal
        title="Default account"
        visible={picker === 'defaultAccount'}
        onClose={() => setPicker(null)}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        selectedId={settings.defaultAccountId}
        onSelect={(v) => apply({ defaultAccountId: v })}
      />
      <PickerModal
        title="Default category"
        visible={picker === 'defaultCategory'}
        onClose={() => setPicker(null)}
        options={categories.filter((c) => c.kind === 'expense').map((c) => ({ id: c.id, label: c.name }))}
        selectedId={settings.defaultCategoryId}
        onSelect={(v) => apply({ defaultCategoryId: v })}
      />
    </Screen>
  );
}

function labelFor<T extends string>(value: T, options: { value: T; label: string }[]): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function SectionHeader({ title }: { title: string }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: space.s5, paddingTop: space.s6, paddingBottom: space.s2 }}>
      <Text variant="caption" color="fgMuted" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Text>
    </View>
  );
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          paddingHorizontal: space.s5,
          paddingVertical: space.s4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.s4,
          backgroundColor: pressed ? c.bgSubtle : 'transparent',
        })}
      >
        <Text style={{ flex: 1 }}>{label}</Text>
        {value ? <Text color="fgMuted">{value}</Text> : null}
        <ChevronRight size={18} color={c.fgSubtle} strokeWidth={1.5} />
      </Pressable>
      <Hairline style={{ marginLeft: space.s5 }} />
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <TopBar
          title={title}
          left={
            <TopBarButton onPress={onClose}>
              <X size={22} color={c.fg} strokeWidth={1.5} />
            </TopBarButton>
          }
        />
        <Hairline />
        <ScrollView>
          {options.map((o) => {
            const selected = o.id === selectedId;
            return (
              <View key={o.id}>
                <Pressable
                  onPress={() => {
                    onSelect(o.id);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: space.s5,
                    paddingVertical: space.s4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.s4,
                    backgroundColor: pressed ? c.bgSubtle : 'transparent',
                  })}
                >
                  <Text style={{ flex: 1 }}>{o.label}</Text>
                  {selected ? <Check size={18} color={c.accent} strokeWidth={2} /> : null}
                </Pressable>
                <Hairline style={{ marginLeft: space.s5 }} />
              </View>
            );
          })}
        </ScrollView>
      </Screen>
    </Modal>
  );
}
