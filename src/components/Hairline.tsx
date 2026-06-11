import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export function Hairline({ style, vertical = false }: { style?: ViewStyle; vertical?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: c.hairline }
          : { height: 1, alignSelf: 'stretch', backgroundColor: c.hairline },
        style,
      ]}
    />
  );
}
