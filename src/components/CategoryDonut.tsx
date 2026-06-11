import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';
import { formatAmount } from '../lib/money';

export interface DonutSegment {
  key: string;
  valueMinor: number;
}

interface Props {
  size: number;
  segments: DonutSegment[];
  totalLabelMinor: number;
  currencyCode: string;
  centerSubLabel?: string;
}

const STROKE = 22;
const GAP_DEG = 2;

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const sweep = endDeg - startDeg;
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function CategoryDonut({ size, segments, totalLabelMinor, currencyCode, centerSubLabel }: Props) {
  const { c } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - STROKE) / 2;

  const total = segments.reduce((s, x) => s + x.valueMinor, 0);
  const hasData = total > 0 && segments.length > 0;

  const arcs: React.ReactNode[] = [];
  if (hasData) {
    let cursor = 0;
    const minSweep = GAP_DEG * (segments.length > 1 ? segments.length : 0) + 2;
    const usableDeg = Math.max(0, 360 - (segments.length > 1 ? GAP_DEG * segments.length : 0));
    if (segments.length === 1) {
      arcs.push(
        <Circle
          key="single"
          cx={cx}
          cy={cy}
          r={r}
          stroke={c.fg}
          strokeWidth={STROKE}
          fill="none"
        />
      );
    } else {
      for (const seg of segments) {
        const sweep = (seg.valueMinor / total) * usableDeg;
        if (sweep <= 0.001) continue;
        const start = cursor;
        const end = cursor + sweep;
        const d = arcPath(cx, cy, r, start, end);
        arcs.push(
          <Path
            key={seg.key}
            d={d}
            stroke={c.fg}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="butt"
          />
        );
        cursor = end + GAP_DEG;
      }
    }
    void minSweep;
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={c.bgSubtle}
            strokeWidth={STROKE}
            fill="none"
          />
          {arcs}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="numericLarge" weight="semibold" mono>
          {formatAmount(totalLabelMinor, currencyCode)}
        </Text>
        {centerSubLabel ? (
          <Text variant="caption" color="fgMuted">{centerSubLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}
