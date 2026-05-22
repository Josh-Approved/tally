import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts, ThemePrefContext, useTheme } from './src/theme';
import { SettingsProvider, useSettings } from './src/state/SettingsProvider';
import { RootNavigator } from './src/navigation';
import AnimatedSplash from './src/components/AnimatedSplash';

// Hold the native launch screen until the JS splash takes over (no icon blink).
SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedRoot({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { settings, ready } = useSettings();
  const themePref = settings?.theme ?? 'system';
  // Ready once fonts AND settings are in. The animated splash overlays until
  // its intro has played and content is ready, then crossfades out.
  const appReady = fontsLoaded && ready;
  const [splashDone, setSplashDone] = useState(false);
  return (
    <ThemePrefContext.Provider value={themePref}>
      {appReady ? <RootNavigator /> : <Loading />}
      {!splashDone && (
        <AnimatedSplash ready={appReady} onFinish={() => setSplashDone(true)} />
      )}
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ThemedRoot fontsLoaded={fontsLoaded} />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
