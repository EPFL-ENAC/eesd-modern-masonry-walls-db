import { NA, ORDERS, type Category } from './derive.ts'

let probe: HTMLElement | undefined
let ctx: CanvasRenderingContext2D | null | undefined

/** A DS token as a colour ECharts can parse: it reads neither var() nor color-mix(). */
export function cssColor(token: string): string {
  probe ??= document.body.appendChild(
    Object.assign(document.createElement('span'), { hidden: true })
  )
  ctx ??= document.createElement('canvas').getContext('2d')
  probe.style.color = `var(${token})`
  // The canvas normalises the computed colour (which may be `color(srgb …)`) to #rrggbb or rgba().
  ctx!.fillStyle = getComputedStyle(probe).color
  return ctx!.fillStyle as string
}

export const cssVar = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

// Token names behind charts/palette.json (HANDOFF §2, §6.3).
const UNIT: Record<string, string> = {
  HC: '--epfl-canard',
  'SB-C': '--epfl-red-dark',
  AAC: '--epfl-blue',
  CS: '--epfl-orange',
  LAC: '--epfl-green-text',
  'SB-CS': '--border-strong',
  CB: '--border-strong',
  HCB: '--border-strong'
}
const FM_GROUP: Record<string, string> = {
  Shear: '--epfl-canard',
  Hybrid: '--epfl-orange',
  Flexure: '--epfl-blue',
  Other: '--border-strong'
}
// The design spreads 4 ordered bins over the 5-step ramp, skipping step 2.
const SEQ = ['--chart-seq-1', '--chart-seq-3', '--chart-seq-4', '--chart-seq-5']

/** Token name of a category's colour: fixed for unit types and failure modes, ramp for bins. */
export function categoryToken(key: Category, value: string): string {
  if (value === NA) return '--epfl-gray-300'
  if (key === 'unit_type') return UNIT[value]!
  if (key === 'fm_group') return FM_GROUP[value]!
  return SEQ[(ORDERS[key] as readonly string[]).indexOf(value)] ?? '--chart-seq-5'
}
