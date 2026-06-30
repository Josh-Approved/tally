import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { AddTransactionSheet } from '../screens/AddTransactionSheet';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { QA_MODE } from '../qa/qaMode';

const Stack = createNativeStackNavigator<RootStackParamList>();

// The navigator only — the canonical <AppShell> owns the NavigationContainer,
// its theme, the status bar, and the cold-start splash.
export function RootNavigator() {
  return (
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
  );
}
