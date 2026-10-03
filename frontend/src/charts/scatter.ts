import type { Row } from '../lib/derive.ts'

type NumKey = 'sigma0' | 'tau_max' | 'H0_H' | 'drift_u' | 'H' | 'Em' | 'Keff'
/** An axis: the derived value plotted, and its label for FieldLabel (symbol + units). */
export type Axis = { key: NumKey; name: string; units: string }

export type Plot = { id: string; x: Axis; y: Axis; jitter?: number }

/** The 4 Data visuals plots (HANDOFF §4.3); jitter spreads discrete x values (build_charts.py). */
export const PLOTS: Plot[] = [
  {
    id: 'strength',
    x: { key: 'sigma0', name: 'σ0', units: '[MPa]' },
    y: { key: 'tau_max', name: 'Vmax/(L·t)', units: '[MPa]' }
  },
  {
    id: 'driftShearSpan',
    x: { key: 'H0_H', name: 'H0/H', units: '[-]' },
    y: { key: 'drift_u', name: 'δu', units: '[%]' },
    jitter: 0.025
  },
  {
    id: 'driftHeight',
    x: { key: 'H', name: 'H', units: '[m]' },
    y: { key: 'drift_u', name: 'δu', units: '[%]' },
    jitter: 0.02
  },
  {
    id: 'stiffness',
    x: { key: 'Em', name: 'Em', units: '[MPa]' },
    y: { key: 'Keff', name: 'Keff', units: '[kN/mm]' }
  }
]

/** Seeded RNG (mulberry32): the jitter stays put between renders. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Points to plot, and how many rows each missing axis dropped (always stated in the caption). */
export function scatterData(rows: readonly Row[], plot: Plot) {
  const random = rng(1)
  const ok = (r: Row, a: Axis) => !Number.isNaN(r[a.key]) && Number.isFinite(r[a.key])
  const points = rows
    .filter((r) => ok(r, plot.x) && ok(r, plot.y))
    .map((r) => ({
      row: r,
      x: r[plot.x.key] + (plot.jitter ? (random() * 2 - 1) * plot.jitter : 0),
      y: r[plot.y.key]
    }))
  return {
    points,
    missingX: rows.filter((r) => !ok(r, plot.x)).length,
    missingY: rows.filter((r) => ok(r, plot.x) && !ok(r, plot.y)).length
  }
}
