import React, { useCallback, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ChevronRight, X, Check } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { TopBar, TopBarButton } from '../components/TopBar';
import { Text } from '../components/Text';
import { Hairline } from '../components/Hairline';
import { LanguageSetting } from '../components/LanguageSetting';
import TipJarSheet from '../components/TipJarSheet';
import { TIP_PRODUCT_IDS } from '../constants/tipProducts';
import { TIP_JAR_ENABLED } from '../lib/links';
import { useTheme, space, AppearanceToggle } from '../theme';
import { t } from '../i18n';
import { getSettings, updateSettings } from '../data/settings';
import { listAccounts } from '../data/accounts';
import { listCategories } from '../data/categories';
import { SUPPORTED_CURRENCIES } from '../lib/currency';
import type { RootStackParamList } from '../navigation/types';
import type { Account, Category, Settings } from '../data/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { c } = useTheme();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [picker, setPicker] = useState<null | 'currency' | 'defaultAccount' | 'defaultCategory'>(null);
  const [tipVisible, setTipVisible] = useState(false);

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

  const defaultAccountName = accounts.find((a) => a.id === settings.defaultAccountId)?.name ?? t('common.none');
  const defaultCategoryName = categories.find((c) => c.id === settings.defaultCategoryId)?.name ?? t('common.none');

  return (
    <Screen>
      <TopBar
        title={t('settings.title')}
        left={
          <TopBarButton onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={c.fg} strokeWidth={1.5} />
          </TopBarButton>
        }
      />
      <Hairline />
      <ScrollView contentContainerStyle={{ paddingBottom: space.s8 }}>
        <SectionHeader title={t('settings.appearance')} />
        <AppearanceToggle style={{ paddingHorizontal: space.s5, paddingBottom: space.s2 }} />

        <SectionHeader title={t('settings.language')} />
        <LanguageSetting />

        <SectionHeader title={t('settings.general')} />
        <Row label={t('settings.currency')} value={settings.currencyCode} onPress={() => setPicker('currency')} />

        <SectionHeader title={t('settings.defaults')} />
        <Row label={t('settings.defaultAccount')} value={defaultAccountName} onPress={() => setPicker('defaultAccount')} />
        <Row label={t('settings.defaultCategory')} value={defaultCategoryName} onPress={() => setPicker('defaultCategory')} />

        <SectionHeader title={t('settings.library')} />
        <Row label={t('settings.categories')} onPress={() => navigation.navigate('Categories')} />
        <Row label={t('settings.accounts')} onPress={() => navigation.navigate('Accounts')} />

        <SectionHeader title={t('settings.about')} />
        <View style={{ paddingHorizontal: space.s5, paddingVertical: space.s4, gap: space.s3 }}>
          <Text>{t('about.blurb')}</Text>
          <Text color="fgMuted" variant="bodySubtle">
            {t('about.madeIndependently')}
          </Text>
        </View>
        {TIP_JAR_ENABLED && <Row label={t('about.support')} onPress={() => setTipVisible(true)} />}
        <Row label={t('about.feedback')} onPress={() => Linking.openURL('mailto:feedback@joshapproved.com')} />
        <Row label={t('about.source')} onPress={() => Linking.openURL('https://github.com/Josh-Approved/tally')} />
        <Row label={t('about.privacy')} onPress={() => Linking.openURL('https://github.com/Josh-Approved/tally/blob/main/PRIVACY.md')} />
      </ScrollView>

      {tipVisible && (
        <TipJarSheet
          visible
          onDismiss={() => setTipVisible(false)}
          productIds={TIP_PRODUCT_IDS}
        />
      )}

      <PickerModal
        title={t('settings.currency')}
        visible={picker === 'currency'}
        onClose={() => setPicker(null)}
        options={SUPPORTED_CURRENCIES.map((cur) => ({ id: cur, label: cur }))}
        selectedId={settings.currencyCode}
        onSelect={(v) => apply({ currencyCode: v })}
      />
      <PickerModal
        title={t('settings.defaultAccount')}
        visible={picker === 'defaultAccount'}
        onClose={() => setPicker(null)}
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        selectedId={settings.defaultAccountId}
        onSelect={(v) => apply({ defaultAccountId: v })}
      />
      <PickerModal
        title={t('settings.defaultCategory')}
        visible={picker === 'defaultCategory'}
        onClose={() => setPicker(null)}
        options={categories.filter((cat) => cat.kind === 'expense').map((cat) => ({ id: cat.id, label: cat.name }))}
        selectedId={settings.defaultCategoryId}
        onSelect={(v) => apply({ defaultCategoryId: v })}
      />
    </Screen>
  );
}

function SectionHeader({ title }: { title: string }) {
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
