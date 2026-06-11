import React from 'react';
import { Pressable, View } from 'react-native';
import { Delete } from 'lucide-react-native';
import { useTheme, space, radius } from '../theme';
import { Text } from './Text';

const KEYS: (string | 'backspace')[] = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', 'backspace',
];

export function Keypad({ onPress }: { onPress: (key: string) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingHorizontal: space.s4 }}>
      {[0, 1, 2, 3].map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {KEYS.slice(row * 3, row * 3 + 3).map((k) => (
            <Pressable
              key={k}
              onPress={() => onPress(k)}
              style={({ pressed }) => ({
                flex: 1,
                marginHorizontal: space.s2,
                marginVertical: space.s2,
                height: 56,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? c.bgSubtle : 'transparent',
              })}
            >
              {k === 'backspace' ? (
                <Delete size={24} color={c.fg} strokeWidth={1.5} />
              ) : (
                <Text variant="numericLarge" weight="regular" mono style={{ fontSize: 26 }}>
                  {k}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
