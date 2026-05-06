import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppFonts, ThemePrefContext, useTheme } from './src/theme';
import { SettingsProvider, useSettings } from './src/state/SettingsProvider';
import { RootNavigator } from './src/navigation';

function ThemedRoot() {
  const { settings, ready } = useSettings();
  const themePref = settings?.theme ?? 'system';
  return (
    <ThemePrefContext.Provider value={themePref}>
      {ready ? <RootNavigator /> : <Loading />}
    </ThemePrefContext.Provider>
  );
}

function Loading() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.fg} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useAppFonts();
  if (!fontsLoaded) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemedRoot />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
