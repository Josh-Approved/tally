import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { CategoryIcon } from './CategoryIcon';
import type { Category } from '../data/types';

export function CategoryGrid({
  categories,
  selectedId,
  onSelect,
  cols = 4,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cols?: number;
}) {
  const { colors, space, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: space.s3,
      }}
    >
      {categories.map((c) => {
        const selected = c.id === selectedId;
        return (
          <View key={c.id} style={{ width: `${100 / cols}%`, padding: space.s2 }}>
            <Pressable
              onPress={() => onSelect(c.id)}
              style={({ pressed }) => ({
                paddingVertical: space.s4,
                paddingHorizontal: space.s2,
                borderWidth: 1,
                borderColor: selected ? colors.fg : colors.hairline,
                backgroundColor: selected ? colors.bgSubtle : colors.bgElevated,
                borderRadius: radius.md,
                alignItems: 'center',
                gap: space.s2,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <CategoryIcon name={c.icon} color={colors.fg} size={22} />
              <Text variant="caption" numberOfLines={1} style={{ textAlign: 'center' }}>
                {c.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
