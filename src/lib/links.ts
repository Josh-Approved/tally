/**
 * Funding-surface flags. One place so every support placement (the Settings /
 * About "Support this app" row, and any future soft prompt) stays in lockstep.
 */

import { Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

export const BMAC_URL = 'https://buymeacoffee.com/jtysonwilliams';

/**
 * Gates the old Buy Me a Coffee link-out. Set false 2026-06-16: Apple rejects
 * external donation links for a for-profit app (App Store guideline 3.1.1 —
 * digital donations must go through In-App Purchase). It stays false — the BMAC
 * link-out is the rejected surface; the IAP tip jar replaces it.
 *
 * TIP_JAR_ENABLED gates the IAP tip jar — the sanctioned 3.1.1 replacement.
 * It powers the same Settings/About support placement the BMAC surface used,
 * now opening the canonical TipJarSheet instead of a browser link.
 */
export const STUDIO_URL = 'https://joshapproved.com';
export const REPO_URL = 'https://github.com/josh-approved/tally';
export const PRIVACY_URL =
  'https://github.com/josh-approved/tally/blob/main/PRIVACY.md';

/** `1.2.0 (47)` — read from the bundle at runtime, never hardcoded. */
export function versionLabel(): string {
  const v = Application.nativeApplicationVersion ?? '1.0.0';
  const b = Application.nativeBuildVersion ?? '1';
  return `${v} (${b})`;
}

export const DONATIONS_ENABLED: boolean = false;

export const TIP_JAR_ENABLED: boolean = true;

/** Opens an arbitrary URL, swallowing failures (e.g. no handler installed). */
export function openUrl(url: string): void {
  Linking.openURL(url).catch(() => {});
}

/** Opens the user's mail composer pre-addressed to studio feedback. */
export function openFeedbackMail(): void {
  openUrl('mailto:feedback@joshapproved.com?subject=' + encodeURIComponent('Tally'));
}

/** Numeric App Store Connect id — filled once the ASC record exists. Empty is
 *  the known pre-store state; the review deep link no-ops cleanly until then. */
export const IOS_APP_STORE_ID = '';
export const ANDROID_PACKAGE = 'com.joshapproved.tally';

/** Opens the platform's write-review page. iOS host pinned to the modern
 *  apps.apple.com (canon § Review prompt); must match ReviewModal.tsx. */
export function openReview(): void {
  const url =
    Platform.OS === 'ios'
      ? `itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`
      : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&showAllReviews=true`;
  Linking.openURL(url).catch(() => {});
}
