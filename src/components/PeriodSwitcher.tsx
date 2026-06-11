import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme, radius, space } from '../theme';
import { Text } from './Text';
import type { PeriodKind } from '../lib/period';

const OPTIONS: { value: PeriodKind; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export function PeriodSwitcher({ value, onChange }: { value: PeriodKind; onChange: (v: PeriodKind) => void }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: c.hairline,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: c.bgElevated,
      }}
    >
      {OPTIONS.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: space.s3,
              paddingHorizontal: space.s4,
              backgroundColor: selected ? c.fg : 'transparent',
              borderLeftWidth: i === 0 ? 0 : 1,
              borderLeftColor: c.hairline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              weight={selected ? 'medium' : 'regular'}
              style={{ color: selected ? c.fgOnInk : c.fgMuted, fontSize: 14 }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
