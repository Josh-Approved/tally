import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useTheme, radius, space } from '../theme';
import { Text } from './Text';
import type { Account } from '../data/types';

export type AccountScope = string | null; // null = all accounts

export function AccountPills({
  accounts,
  value,
  onChange,
}: {
  accounts: Account[];
  value: AccountScope;
  onChange: (next: AccountScope) => void;
}) {
  const { c } = useTheme();
  const items: { id: AccountScope; name: string }[] = [
    { id: null, name: 'All accounts' },
    ...accounts.map((a) => ({ id: a.id as AccountScope, name: a.name })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: space.s5,
        gap: space.s3,
        paddingVertical: space.s2,
      }}
    >
      {items.map((it) => {
        const selected = it.id === value;
        return (
          <Pressable
            key={it.id ?? 'all'}
            onPress={() => onChange(it.id)}
            style={{
              paddingHorizontal: space.s4,
              paddingVertical: space.s2,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: selected ? c.fg : c.hairline,
              backgroundColor: selected ? c.fg : 'transparent',
            }}
          >
            <Text
              variant="bodySubtle"
              weight={selected ? 'medium' : 'regular'}
              style={{ color: selected ? c.fgOnInk : c.fgMuted }}
            >
              {it.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
