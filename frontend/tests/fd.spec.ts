import { describe, expect, it } from 'vitest'
import { byN } from '../src/api/dataset.ts'
import { limitPoints, toAxes } from '../src/charts/fd.ts'

const r = byN.get(227)! // SW0.1: H 1.4 m, L 1.075 m, t 0.25 m

describe('toAxes', () => {
  it('V vs d: drift [%] of the wall height, in mm', () => {
    expect(toAxes('Vd', r)(0.17, 107.5)).toEqual([2.38, 107.5].map((x) => expect.closeTo(x, 9)))
  })
  it('τ vs δ: V over L·t, in MPa', () => {
    expect(toAxes('tau', r)(0.17, 107.5)).toEqual([0.17, expect.closeTo(0.4, 9)])
  })
})

describe('limitPoints', () => {
  it('reads ± from the database, the − side mirrored', () => {
    const p = limitPoints(r, 'Pavia')
    expect(p.max).toEqual([
      [0.17, 107.5],
      [-0.14, -99.4375]
    ])
    // δcr is a single drift since 22/10/2026: drawn on both sides.
    expect(p.cracking).toEqual([
      [0.09, null],
      [-0.09, null]
    ])
  })

  it('takes yield and ultimate from the chosen bilinear method', () => {
    // Pavia and EPFL share column names: this fails if one overwrites the other.
    expect(limitPoints(r, 'Pavia').yield[0]).toEqual([
      expect.closeTo(0.0859, 4),
      expect.closeTo(92.41, 2)
    ])
    expect(limitPoints(r, 'EPFL').yield[0]).toEqual([
      expect.closeTo(0.0843, 4),
      expect.closeTo(95.93, 2)
    ])
  })
})
