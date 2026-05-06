import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export function TopBar({
  title,
  left,
  right,
}: {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { space, target } = useTheme();
  return (
    <View
      style={{
        height: target.min + space.s2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.s3,
      }}
    >
      <View style={{ width: target.min, height: target.min, alignItems: 'flex-start', justifyContent: 'center' }}>
        {left}
      </View>
      <Text weight="semibold" style={{ fontSize: 17 }}>{title}</Text>
      <View style={{ width: target.min, height: target.min, alignItems: 'flex-end', justifyContent: 'center' }}>
        {right}
      </View>
    </View>
  );
}

export function TopBarButton({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const { target } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{ width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Pressable>
  );
}
