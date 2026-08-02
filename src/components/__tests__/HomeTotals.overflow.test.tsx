/**
 * Regression net for defect tally-20260801-1 — "the home screen cannot fit its
 * own numbers". The shipped store screenshot showed the donut centre reading
 * "USD1,730." with the "4" on a second line and spilling outside the ring, and
 * all three TotalsRow figures wrapping mid-number.
 *
 * The unit half of the fix lives in src/lib/__tests__/money.test.ts (the symbol
 * table + the shrink-to-fit arithmetic). This file pins the WIRING: that the two
 * components actually apply the single-line + fitted-size treatment, which is
 * the part a pure test cannot see. Both assertions fail on the pre-fix
 * components, whose figures had no numberOfLines and no fitted font size.
 *
 * Follows the ScreenHeader.component.test.tsx exemplar: native side-effect
 * stubs first, then the component import.
 */

import React from 'react';
import { Dimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { CategoryDonut, centerLabelWidth } from '../CategoryDonut';
import { TotalsRow, totalsColumnWidth } from '../TotalsRow';

// IBM Plex Mono advances 0.6em per glyph; the fitter budgets 0.62em.
const MONO_ADVANCE = 0.62;
const renderedWidth = (text: string, fontSize: number) => text.length * MONO_ADVANCE * fontSize;

function styleOf(node: { props: { style?: unknown } }): Record<string, unknown> {
  const flat = ([] as unknown[]).concat(node.props.style ?? []);
  return Object.assign({}, ...flat.map((s) => (s && typeof s === 'object' ? s : {})));
}

// The QA_MODE seed (src/qa/fixtures.ts, period frozen to Nov 2023) — the exact
// figures in the defective screenshot.
const SEED = { income: 320000, expense: 173044, net: 146956 };

describe('CategoryDonut centre label', () => {
  it('renders the total as a symbol, on one line, small enough to stay inside the ring', async () => {
    await render(
      <CategoryDonut
        size={240}
        segments={[{ key: 'a', valueMinor: SEED.expense }]}
        totalLabelMinor={SEED.expense}
        currencyCode="USD"
        centerSubLabel="spent"
      />
    );

    // A symbol, never the wide ISO code that started this.
    const label = screen.getByText('$1,730.44');
    expect(screen.queryByText(/USD/)).toBeNull();

    // One line — it can never wrap the last digit onto a second row.
    expect(label.props.numberOfLines).toBe(1);

    // ...and it fits the hole rather than spilling out over the ring.
    const fontSize = styleOf(label).fontSize as number;
    expect(typeof fontSize).toBe('number');
    expect(renderedWidth('$1,730.44', fontSize)).toBeLessThanOrEqual(centerLabelWidth(240));
  });

  it('keeps a year-scale total inside the ring too', async () => {
    await render(
      <CategoryDonut
        size={240}
        segments={[{ key: 'a', valueMinor: 1234567890 }]}
        totalLabelMinor={1234567890}
        currencyCode="USD"
      />
    );
    const label = screen.getByText('$12,345,678.90');
    expect(label.props.numberOfLines).toBe(1);
    const fontSize = styleOf(label).fontSize as number;
    expect(renderedWidth('$12,345,678.90', fontSize)).toBeLessThanOrEqual(centerLabelWidth(240));
  });
});

describe('TotalsRow figures', () => {
  it('renders Income / Expenses / Net on one line each, as symbols', async () => {
    await render(
      <TotalsRow
        incomeMinor={SEED.income}
        expenseMinor={SEED.expense}
        netMinor={SEED.net}
        currencyCode="USD"
      />
    );

    const figures = ['$3,200.00', '$1,730.44', '+$1,469.56'].map((text) =>
      screen.getByText(text)
    );

    expect(screen.queryByText(/USD/)).toBeNull();

    // Before layout the row falls back to the window width, so that is the
    // column budget every figure has to fit inside.
    const colWidth = totalsColumnWidth(Dimensions.get('window').width);
    for (const figure of figures) {
      expect(figure.props.numberOfLines).toBe(1);
      const fontSize = styleOf(figure).fontSize as number;
      expect(typeof fontSize).toBe('number');
      expect(renderedWidth(figure.props.children as string, fontSize)).toBeLessThanOrEqual(
        colWidth
      );
    }
  });

  it('sizes all three figures the same, so the row does not stair-step', async () => {
    await render(
      <TotalsRow
        incomeMinor={SEED.income}
        expenseMinor={SEED.expense}
        netMinor={SEED.net}
        currencyCode="USD"
      />
    );
    const sizes = ['$3,200.00', '$1,730.44', '+$1,469.56'].map(
      (text) => styleOf(screen.getByText(text)).fontSize
    );
    expect(sizes.every((s) => typeof s === 'number')).toBe(true);
    expect(new Set(sizes).size).toBe(1);
  });
});
