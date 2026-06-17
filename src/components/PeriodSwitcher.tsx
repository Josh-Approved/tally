import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme, radius, space } from '../theme';
import { Text } from './Text';
import { t } from '../i18n';
import type { PeriodKind } from '../lib/period';

const OPTIONS: PeriodKind[] = ['day', 'week', 'month', 'year'];

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
      {OPTIONS.map((opt, i) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
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
              style={{ color: selected ? c.inkButtonText : c.fgMuted, fontSize: 14 }}
            >
              {t(`period.${opt}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
