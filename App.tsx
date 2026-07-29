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
import { IOS_APP_STORE_ID, ANDROID_PACKAGE } from './src/lib/links';

// Store identity for the canonical review prompt. The shell owns the trigger —
// it counts the session, applies the 3/15/30 schedule and the 3-per-install cap,
// and mounts the modal; this app carries no trigger code. Module scope (not an
// inline literal) so the prop's identity is stable across renders.
const REVIEW = {
  appName: 'Tally',
  iosAppStoreId: IOS_APP_STORE_ID,
  androidPackageName: ANDROID_PACKAGE,
};

// Hold the native launch screen until the JS splash takes over (no icon blink).
// Must run at module scope, before first paint; skipped under QA_MODE so the
// capture harness sees deterministic frames. AppShell owns hiding it.
if (!QA_MODE) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function AppRoot({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready } = useSettings();
  return (
    <AppShell ready={fontsLoaded && ready} review={REVIEW}>
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
