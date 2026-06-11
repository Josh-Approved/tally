import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme, space, target } from '../theme';
import { Text } from './Text';

export function PeriodHeader({
  label,
  onPrev,
  onNext,
  onResetToToday,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onResetToToday?: () => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.s5,
        paddingVertical: space.s3,
      }}
    >
      <Pressable
        onPress={onPrev}
        hitSlop={8}
        style={{ width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={22} color={c.fg} strokeWidth={1.75} />
      </Pressable>
      <Pressable onPress={onResetToToday} hitSlop={8}>
        <Text weight="medium">{label}</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        hitSlop={8}
        style={{ width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronRight size={22} color={c.fg} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}
