import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export function Hairline({ style, vertical = false }: { style?: ViewStyle; vertical?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: colors.hairline }
          : { height: 1, alignSelf: 'stretch', backgroundColor: colors.hairline },
        style,
      ]}
    />
  );
}
