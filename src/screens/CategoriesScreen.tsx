import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Eye, EyeOff, X } from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { TopBar, TopBarButton } from '../components/TopBar';
import { Text } from '../components/Text';
import { Hairline } from '../components/Hairline';
import { CategoryIcon, ICON_NAMES } from '../components/CategoryIcon';
import { Button } from '../components/Button';
import { useTheme, space, radius } from '../theme';
import { listCategories, createCategory, updateCategory } from '../data/categories';
import type { Category, TxKind } from '../data/types';

export function CategoriesScreen() {
  const navigation = useNavigation();
  const { c } = useTheme();

  const [tab, setTab] = useState<TxKind>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const reload = useCallback(async () => {
    setCategories(await listCategories({ includeHidden: true }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const visible = useMemo(() => categories.filter((c) => c.kind === tab), [categories, tab]);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditorOpen(true);
  };

  return (
    <Screen>
      <TopBar
        title="Categories"
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
      <View style={{ flexDirection: 'row', paddingHorizontal: space.s5, paddingVertical: space.s4 }}>
        {(['expense', 'income'] as TxKind[]).map((k, i) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            style={{
              flex: 1,
              paddingVertical: space.s3,
              borderBottomWidth: 2,
              borderColor: tab === k ? c.fg : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text weight={tab === k ? 'medium' : 'regular'} color={tab === k ? 'fg' : 'fgMuted'}>
              {k === 'expense' ? 'Expenses' : 'Income'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Hairline />
      <FlatList
        data={visible}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View>
            <Pressable
              onPress={() => openEdit(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: space.s5,
                paddingVertical: space.s4,
                gap: space.s4,
                backgroundColor: pressed ? c.bgSubtle : 'transparent',
                opacity: item.hidden ? 0.5 : 1,
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
                <CategoryIcon name={item.icon} color={c.fg} size={18} />
              </View>
              <Text style={{ flex: 1 }}>{item.name}</Text>
              <Pressable
                onPress={async () => {
                  await updateCategory(item.id, { hidden: !item.hidden });
                  reload();
                }}
                hitSlop={8}
              >
                {item.hidden ? (
                  <EyeOff size={18} color={c.fgMuted} strokeWidth={1.5} />
                ) : (
                  <Eye size={18} color={c.fgMuted} strokeWidth={1.5} />
                )}
              </Pressable>
            </Pressable>
            <Hairline style={{ marginLeft: space.s5 + 36 + space.s4 }} />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: space.s7, alignItems: 'center' }}>
            <Text color="fgMuted">No categories yet.</Text>
          </View>
        }
      />

      <CategoryEditor
        visible={editorOpen}
        editing={editing}
        kind={tab}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false);
          reload();
        }}
      />
    </Screen>
  );
}

function CategoryEditor({
  visible,
  editing,
  kind,
  onClose,
  onSaved,
}: {
  visible: boolean;
  editing: Category | null;
  kind: TxKind;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');

  React.useEffect(() => {
    if (visible) {
      setName(editing?.name ?? '');
      setIcon(editing?.icon ?? (kind === 'expense' ? 'circle' : 'briefcase'));
    }
  }, [visible, editing, kind]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required');
      return;
    }
    if (editing) {
      await updateCategory(editing.id, { name: trimmed, icon });
    } else {
      await createCategory({ name: trimmed, kind, icon });
    }
    onSaved();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <TopBar
          title={editing ? 'Edit category' : 'New category'}
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
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={kind === 'expense' ? 'e.g. Coffee' : 'e.g. Bonus'}
              placeholderTextColor={c.fgSubtle}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: c.hairline,
                borderRadius: radius.md,
                paddingHorizontal: space.s4,
                paddingVertical: space.s4,
                color: c.fg,
                fontSize: 16,
                backgroundColor: c.bgElevated,
              }}
            />
          </View>
          <View>
            <Text variant="caption" color="fgMuted" weight="medium" style={{ marginBottom: space.s3 }}>
              Icon
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 }}>
              {ICON_NAMES.map((n) => {
                const selected = n === icon;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setIcon(n)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected ? c.fg : c.hairline,
                      backgroundColor: selected ? c.bgSubtle : c.bgElevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CategoryIcon name={n} color={c.fg} size={20} />
                  </Pressable>
                );
              })}
            </View>
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
          <Button label={editing ? 'Save changes' : 'Add category'} onPress={handleSave} fullWidth />
        </View>
      </Screen>
    </Modal>
  );
}
