/**
 * App root for Tally. The shell (<AppShell/>) owns the chrome — gesture root,
 * safe area, error boundary, themed NavigationContainer, status bar, and the
 * cold-start splash. App.tsx owns only the readiness gate (fonts + the settings
 * store's hydration) and the screen list (RootNavigator).
 */

import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAppFonts } from './src/theme';
import { AppShell } from './src/shell/AppShell';
import { SettingsProvider, useSettings } from './src/state/SettingsProvider';
import { RootNavigator } from './src/navigation';
import { QA_MODE } from './src/qa/qaMode';

// Hold the native launch screen until the JS splash takes over (no icon blink).
// Must run at module scope, before first paint; skipped under QA_MODE so the
// capture harness sees deterministic frames. AppShell owns hiding it.
if (!QA_MODE) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function AppRoot({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready } = useSettings();
  return (
    <AppShell ready={fontsLoaded && ready}>
      <RootNavigator />
    </AppShell>
  );
}

export default function App() {
  const [fontsLoaded] = useAppFonts();
  return (
    <SettingsProvider>
      <AppRoot fontsLoaded={fontsLoaded} />
    </SettingsProvider>
  );
}
