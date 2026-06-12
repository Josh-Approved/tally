import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { AddTransactionSheet } from '../screens/AddTransactionSheet';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { useTheme } from '../theme';
import { QA_MODE } from '../qa/qaMode';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { c, isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: c.bg,
      card: c.bg,
      text: c.fg,
      border: c.hairline,
      primary: c.fg,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, ...(QA_MODE ? { animation: 'none' } : null) }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionSheet}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Accounts" component={AccountsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
