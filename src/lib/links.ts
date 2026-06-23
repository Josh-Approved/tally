/**
 * Funding-surface flags. One place so every support placement (the Settings /
 * About "Support this app" row, and any future soft prompt) stays in lockstep.
 */

import { Linking, Platform } from 'react-native';

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
export const DONATIONS_ENABLED: boolean = false;

export const TIP_JAR_ENABLED: boolean = true;

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
