import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme, space, radius } from '../theme';
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
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: space.s3,
      }}
    >
      {categories.map((cat) => {
        const selected = cat.id === selectedId;
        return (
          <View key={cat.id} style={{ width: `${100 / cols}%`, padding: space.s2 }}>
            <Pressable
              onPress={() => onSelect(cat.id)}
              style={({ pressed }) => ({
                paddingVertical: space.s4,
                paddingHorizontal: space.s2,
                borderWidth: 1,
                borderColor: selected ? c.fg : c.hairline,
                backgroundColor: selected ? c.bgSubtle : c.bgElevated,
                borderRadius: radius.md,
                alignItems: 'center',
                gap: space.s2,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <CategoryIcon name={cat.icon} color={c.fg} size={22} />
              <Text variant="caption" numberOfLines={1} style={{ textAlign: 'center' }}>
                {cat.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
