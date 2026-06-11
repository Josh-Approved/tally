import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts, useTheme } from './src/theme';
import { SettingsProvider, useSettings } from './src/state/SettingsProvider';
import { RootNavigator } from './src/navigation';
import AnimatedSplash from './src/components/AnimatedSplash';

// Hold the native launch screen until the JS splash takes over (no icon blink).
SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedRoot({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { settings, ready } = useSettings();
  const themePref = settings?.theme ?? 'system';
  // Honor the user's Theme preference (system/light/dark). Appearance
  // .setColorScheme forces what useColorScheme() — and thus the canonical
  // useTheme() — reports app-wide; null reverts to the OS scheme. This keeps
  // the preference working without forking the canonical theme module.
  useEffect(() => {
    Appearance.setColorScheme(themePref === 'system' ? null : themePref);
  }, [themePref]);
  // Ready once fonts AND settings are in. The animated splash overlays until
  // its intro has played and content is ready, then crossfades out.
  const appReady = fontsLoaded && ready;
  const [splashDone, setSplashDone] = useState(false);
  return (
    <>
      {appReady ? <RootNavigator /> : <Loading />}
      {!splashDone && (
        <AnimatedSplash ready={appReady} onFinish={() => setSplashDone(true)} />
      )}
    </>
  );
}

function Loading() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
      <ActivityIndicator color={c.fg} />
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
