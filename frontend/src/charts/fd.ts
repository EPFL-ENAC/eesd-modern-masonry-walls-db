import { num, type Row } from '../lib/derive.ts'

/** "V vs d": V [kN] against d [mm]; "τ vs δ": τ [MPa] against drift [%] (open question 3). */
export type Mode = 'Vd' | 'tau'

/** Map a curve point (drift [%], V [kN]) to the axes of the mode; drift is taken as d/H. */
export function toAxes(mode: Mode, r: Pick<Row, 'H' | 'L' | 't'>) {
  return mode === 'Vd'
    ? (drift: number, V: number): [number, number] => [(drift / 100) * r.H * 1000, V]
    : (drift: number, V: number): [number, number] => [drift, V / (r.L * r.t) / 1000]
}

export const POINTS = ['cracking', 'yield', 'max', 'ultimate'] as const
export type Point = (typeof POINTS)[number]

/**
 * Limit-state points of a specimen, + then − direction, as (drift [%], V [kN]).
 * The database stores − values as magnitudes, so they plot at (−d, −V).
 * Cracking has no V: it is a vertical line.
 */
export function limitPoints(r: Row): Record<Point, [number, number | null][]> {
  const v = (name: string) => num(r.values[name])
  const both = (d: string, V: string | null) =>
    (
      [
        ['+', 1],
        ['-', -1]
      ] as const
    )
      .map(([s, sign]): [number, number | null] => [sign * v(d + s), V ? sign * v(V + s) : null])
      .filter(([d, V]) => !Number.isNaN(d) && (V == null || !Number.isNaN(V)))
  return {
    cracking: both('δcr', null),
    yield: both('δe', 'Vbil'),
    max: both('δVmax', 'Vmax'),
    ultimate: both('δu', 'Vbil')
  }
}
