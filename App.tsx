import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts, useTheme } from './src/theme';
import { SettingsProvider, useSettings } from './src/state/SettingsProvider';
import { RootNavigator } from './src/navigation';
import AnimatedSplash from './src/components/AnimatedSplash';
import { QA_MODE } from './src/qa/qaMode';

// Hold the native launch screen until the JS splash takes over (no icon blink).
// Under QA, let it auto-hide so capture builds reach the first real frame
// immediately (deterministic screenshots; no animated intro). Tree-shaken in prod.
if (!QA_MODE) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

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
  // QA capture builds skip the animated splash entirely for a deterministic
  // first frame.
  const [splashDone, setSplashDone] = useState(QA_MODE);
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
