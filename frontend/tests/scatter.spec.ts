import { describe, expect, it } from 'vitest'
import { rows } from '../src/api/dataset.ts'
import { PLOTS, scatterData } from '../src/charts/scatter.ts'

const hc = rows.filter((r) => r.unit_type === 'HC')
const plot = (id: string) =>
  scatterData(
    hc,
    PLOTS.find((p) => p.id === id)!
  )

describe('scatterData (HC filter, the design numbers)', () => {
  it('counts the plotted points', () => {
    expect(PLOTS.map((p) => scatterData(hc, p).points.length)).toEqual([111, 109, 109, 63])
  })

  it('states what each missing axis dropped: Em not reported for 47', () => {
    expect(plot('stiffness')).toMatchObject({ missingX: 47, missingY: 1 })
  })

  it('jitters within ±0.025 and the same way every time', () => {
    const a = plot('driftShearSpan').points
    expect(a.every((p) => Math.abs(p.x - p.row.H0_H) <= 0.025)).toBe(true)
    expect(plot('driftShearSpan').points.map((p) => p.x)).toEqual(a.map((p) => p.x))
  })
})
