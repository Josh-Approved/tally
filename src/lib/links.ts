/**
 * Funding-surface flags. One place so every support placement (the Settings /
 * About "Support this app" row, and any future soft prompt) stays in lockstep.
 */

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
