import { ORDERS, type Category, type Row } from '../lib/derive.ts'

/** Axes of "How parameters connect", left to right (HANDOFF §4.1, σ₀ for σ₀/fm). */
export const FLOW_AXES = [
  'unit_type',
  'fm_group',
  'bin_H',
  'bin_H_L',
  'bin_H0_H',
  'bin_sigma0',
  'bin_fm',
  'bin_drift_u'
] as const satisfies readonly Category[]

export type Link = { source: string; target: string; value: number; unit: string }

/** Node names are `axis:value` ("n/a" sits on several axes). */
export const nodeLabel = (name: string) => name.slice(name.indexOf(':') + 1)

/**
 * Parallel-sets data as in build_charts.py `sankey`: nodes in ORDERS order per axis,
 * one link per (adjacent pair of categories, unit type) so bands colour by unit type.
 */
export function flows(rows: readonly Row[]) {
  const nodes = FLOW_AXES.flatMap((axis, depth) =>
    ORDERS[axis]
      .filter((k) => rows.some((r) => r[axis] === k))
      .map((k) => ({ name: `${axis}:${k}`, depth }))
  )
  const links = new Map<string, Link>()
  FLOW_AXES.slice(1).forEach((b, i) => {
    const a = FLOW_AXES[i]!
    for (const r of rows) {
      const source = `${a}:${r[a]}`
      const target = `${b}:${r[b]}`
      const id = `${source}|${target}|${r.unit_type}`
      const link = links.get(id) ?? { source, target, value: 0, unit: r.unit_type }
      link.value++
      links.set(id, link)
    }
  })
  // Unit-type order inside each band group; ECharts' own edge sort is stable.
  const unitIndex = (u: string) => (ORDERS.unit_type as readonly string[]).indexOf(u)
  return { nodes, links: [...links.values()].sort((p, q) => unitIndex(p.unit) - unitIndex(q.unit)) }
}
