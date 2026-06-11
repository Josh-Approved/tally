import React from 'react';
import { Pressable, View, type PressableProps, type ViewStyle } from 'react-native';
import { useTheme, radius, space, target } from '../theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ label, variant = 'primary', icon, fullWidth, style, disabled, ...rest }: ButtonProps) {
  const { c } = useTheme();
  const bg =
    variant === 'primary' ? c.fg :
    variant === 'danger' ? c.danger :
    variant === 'secondary' ? c.bgElevated :
    'transparent';
  const fg =
    variant === 'primary' ? c.fgOnInk :
    variant === 'danger' ? c.fgOnAccent :
    c.fg;
  const border = variant === 'secondary' ? c.hairline : 'transparent';
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: target.min,
          paddingHorizontal: space.s5,
          paddingVertical: space.s3,
          backgroundColor: bg,
          borderRadius: radius.md,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: border,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...rest}
    >
      {icon ? <View style={{ marginRight: space.s3 }}>{icon}</View> : null}
      <Text
        weight="medium"
        style={{
          color: fg,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
