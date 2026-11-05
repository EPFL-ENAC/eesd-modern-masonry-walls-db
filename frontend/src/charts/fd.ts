import { num, type Row } from '../lib/derive.ts'

/** "V vs d": V [kN] against d [mm]; "τ vs δ": τ [MPa] against drift [%] (open question 3). */
export type Mode = 'Vd' | 'tau'

/** Map a curve point (drift [%], V [kN]) to the axes of the mode; drift is taken as d/H. */
export function toAxes(mode: Mode, r: Pick<Row, 'H' | 'L' | 't'>) {
  return mode === 'Vd'
    ? (drift: number, V: number): [number, number] => [(drift / 100) * r.H * 1000, V]
    : (drift: number, V: number): [number, number] => [drift, V / (r.L * r.t) / 1000]
}

/**
 * Bilinear idealisation methods (Database categories VI and VII). They share
 * column names; convert-data keys the EPFL ones 'Vbil+ [VII]'.
 */
export const METHODS = ['Pavia', 'EPFL'] as const
export type Method = (typeof METHODS)[number]
export const METHOD_SUFFIX: Record<Method, string> = { Pavia: '', EPFL: ' [VII]' }

export const POINTS = ['cracking', 'yield', 'max', 'ultimate'] as const
export type Point = (typeof POINTS)[number]

/**
 * Limit-state points of a specimen, + then − direction, as (drift [%], V [kN]),
 * yield and ultimate from the given bilinear method.
 * The database stores − values as magnitudes, so they plot at (−d, −V).
 * Cracking has no V: it is a vertical line.
 */
export function limitPoints(r: Row, method: Method): Record<Point, [number, number | null][]> {
  const v = (name: string) => num(r.values[name])
  const both = (d: string, V: string | null, suffix = '') =>
    (
      [
        ['+', 1],
        ['-', -1]
      ] as const
    )
      .map(([s, sign]): [number, number | null] => [
        sign * v(d + s + suffix),
        V ? sign * v(V + s + suffix) : null
      ])
      .filter(([d, V]) => !Number.isNaN(d) && (V == null || !Number.isNaN(V)))
  const cr = v('δcr')
  const bil = METHOD_SUFFIX[method]
  return {
    // One drift at first crack, whichever the direction: a line on each side.
    cracking: Number.isNaN(cr)
      ? []
      : [
          [cr, null],
          [-cr, null]
        ],
    yield: both('δe', 'Vbil', bil),
    max: both('δVmax', 'Vmax'),
    ultimate: both('δu', 'Vbil', bil)
  }
}
