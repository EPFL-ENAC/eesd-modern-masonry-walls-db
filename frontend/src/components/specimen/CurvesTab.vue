<template>
  <div class="curves">
    <div class="curves-main">
      <div class="curves-bar">
        <div class="curves-layers">
          <span v-if="present.length" class="curves-muted">{{ t('specimen.layers') }}</span>
          <button
            v-for="l in present"
            :key="l"
            type="button"
            class="layer"
            :aria-pressed="layers[l]"
            @click="layers[l] = !layers[l]"
          >
            <span class="line" :class="`line-${l}`" />
            {{ t(`specimen.layer.${l}`) }}
          </button>
        </div>
        <div class="curves-switches">
          <span class="curves-muted">{{ t('specimen.method') }}</span>
          <div class="seg" role="group" :aria-label="t('specimen.method')">
            <button
              v-for="m in METHODS"
              :key="m"
              type="button"
              :aria-pressed="method === m"
              :disabled="!available.includes(m)"
              @click="method = m"
            >
              {{ t(`specimen.methods.${m}`) }}
            </button>
          </div>
          <div class="seg" role="group" :aria-label="t('specimen.axes')">
            <button
              v-for="m in ['Vd', 'tau'] as const"
              :key="m"
              type="button"
              :aria-pressed="mode === m"
              @click="mode = m"
            >
              {{ t(`specimen.mode.${m}`) }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="error" class="curves-muted" role="alert">{{ error }}</p>
      <VChart
        v-else-if="hasData"
        class="fd-chart"
        :option="option"
        autoresize
        role="img"
        :aria-label="
          t('specimen.chartLabel', { name: row.specimen, method: t(`specimen.methods.${method}`) })
        "
      />
      <p v-else class="curves-muted">{{ t('specimen.noCurve') }}</p>
      <ul v-if="present.length" class="fd-legend">
        <li v-for="l in present" :key="l">
          <span class="line" :class="`line-${l}`" />{{ t(`specimen.legend.${l}`) }}
        </li>
      </ul>
    </div>

    <aside class="curves-side">
      <fieldset class="points">
        <!-- Symbols keep their case: uppercase would turn δ, τ into Δ, T. -->
        <legend class="section-label">
          {{ t('specimen.points.title') }}
          <span class="keep-case">{{ t(`specimen.points.axes.${mode}`) }}</span>
        </legend>
        <label v-for="p in POINTS" :key="p" class="point">
          <input v-model="shown" type="checkbox" :value="p" :disabled="!points[p].length" />
          <span class="marker" :class="`marker-${p}`" aria-hidden="true" />
          <span>
            <span class="point-name">{{ t(`specimen.points.${p}`) }}</span>
            <span class="point-value">{{
              points[p].length ? pointText(p) : t('filters.notReported')
            }}</span>
          </span>
        </label>
      </fieldset>
      <dl class="kv">
        <div class="kv-row">
          <dt>{{ t('filters.items.fm_group') }}</dt>
          <dd>{{ failureMode }}</dd>
        </div>
        <div class="kv-row">
          <dt><FieldLabel :field="{ name: 'Vbil', units: '' }" /> {{ t('units.plusMinus') }}</dt>
          <dd>{{ t('units.kN', { v: pair('Vbil', 1, METHOD_SUFFIX[method]) }) }}</dd>
        </div>
        <div class="kv-row">
          <dt>{{ t('specimen.maxDrift') }} {{ t('units.plusMinus') }}</dt>
          <dd>{{ t('units.percent', { v: pair('δmax', 2) }) }}</dd>
        </div>
        <div class="kv-row">
          <dt>{{ t('specimen.axialStress') }} <FieldLabel :field="{ name: 'σ0', units: '' }" /></dt>
          <dd>{{ t('units.MPa', { v: fixed(row.sigma0, 2) }) }}</dd>
        </div>
        <div class="kv-row">
          <dt>{{ t('specimen.dims') }}</dt>
          <dd>
            {{ t('specimen.dimsValue', { h: row.values.H, l: row.values.L, t: row.values.t }) }}
          </dd>
        </div>
      </dl>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsOption, SeriesOption } from 'echarts'
import { loadCurve, type Curve } from '../../api/dataset.ts'
import { VChart } from '../../charts/echarts.ts'
import {
  METHODS,
  METHOD_SUFFIX,
  POINTS,
  limitPoints,
  toAxes,
  type Method,
  type Mode,
  type Point
} from '../../charts/fd.ts'
import { num, type Row } from '../../lib/derive.ts'
import { cssColor } from '../../lib/tokens.ts'
import FieldLabel from '../FieldLabel.vue'

const props = defineProps<{ row: Row }>()
const { t, te } = useI18n()

type Layer = 'fd' | 'envelope' | 'bilinear' | 'cycles'
const LAYERS: Layer[] = ['fd', 'envelope', 'bilinear', 'cycles']
/** Each method's curve folders; Pavia's also hold an envelope and a bilinear per loading cycle. */
const FOLDERS: Record<Method, Record<'envelope' | 'bilinear', string>> = {
  Pavia: { envelope: '03_envelope_Pavia/', bilinear: '05_bilinear_curve_Pavia/' },
  EPFL: { envelope: '04_envelope_EPFL/', bilinear: '06_bilinear_curve_EPFL/' }
}
const CYCLE = /_cycle\d+\.csv$/

// The panel draws whatever files exist (open question 4): nothing is hard-coded.
function layerFiles(m: Method, l: Layer) {
  const { envelope, bilinear } = FOLDERS[m]
  return props.row.files.filter((f) => {
    if (l === 'fd') return f.startsWith('02_fd_curve/')
    if (l === 'cycles') return CYCLE.test(f) && (f.startsWith(envelope) || f.startsWith(bilinear))
    return !CYCLE.test(f) && f.startsWith(FOLDERS[m][l])
  })
}

/** Methods with curves or bilinear values for this specimen. */
const available = computed(() =>
  METHODS.filter((m) => {
    const p = limitPoints(props.row, m)
    return (
      p.yield.length ||
      p.ultimate.length ||
      LAYERS.some((l) => l !== 'fd' && layerFiles(m, l).length)
    )
  })
)

const mode = ref<Mode>('Vd')
const method = ref<Method>(available.value[0] ?? 'Pavia')
const layers = reactive<Record<Layer, boolean>>({
  fd: true,
  envelope: true,
  bilinear: true,
  cycles: false
})
const shown = ref<Point[]>([...POINTS])
/** Every curve file of the specimen, both methods, by path. */
const curves = shallowRef(new Map<string, Curve>())
const error = ref('')

watch(
  () => props.row,
  async (r) => {
    error.value = ''
    curves.value = new Map()
    if (!available.value.includes(method.value)) method.value = available.value[0] ?? 'Pavia'
    try {
      const paths = r.files.filter((f) => /^0[2-6]_/.test(f))
      const loaded = await Promise.all(paths.map(loadCurve))
      if (r === props.row) curves.value = new Map(paths.map((p, i) => [p, loaded[i]!]))
    } catch (e) {
      error.value = t('specimen.loadFailed', { reason: (e as Error).message })
    }
  },
  { immediate: true }
)

const present = computed(() => LAYERS.filter((l) => layerFiles(method.value, l).length))
const points = computed(() => limitPoints(props.row, method.value))
const hasData = computed(
  () => present.value.length > 0 || POINTS.some((p) => points.value[p].length)
)

const fixed = (v: number, digits: number) =>
  Number.isNaN(v) ? t('specimen.missing') : v.toFixed(digits)
const pair = (name: string, digits: number, suffix = '') =>
  `${fixed(num(props.row.values[`${name}+${suffix}`]), digits)} / ${fixed(num(props.row.values[`${name}-${suffix}`]), digits)}`

const failureMode = computed(() => {
  const code = props.row.failure_mode
  if (!code) return t('specimen.missing')
  if (te(`failureModes.${code}`)) return t(`failureModes.${code}`)
  return code.startsWith('H-') ? t('failureModes.hybrid', { code }) : code
})

/** "+0.17 %, 107.5 kN · −0.14 %, 99.4 kN", in the units of the mode. */
function pointText(p: Point) {
  const map = toAxes(mode.value, props.row)
  const [xu, yu, digits] = mode.value === 'Vd' ? ['mm', 'kN', 1] : ['percent', 'MPa', 2]
  const signed = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(digits)}`
  return points.value[p]
    .map(([d, V]) => {
      const [x, y] = map(d, V ?? 0)
      const xs = t(`units.${xu}`, { v: signed(x) })
      return V == null ? xs : `${xs}, ${t(`units.${yu}`, { v: Math.abs(y).toFixed(digits) })}`
    })
    .join(' · ')
}

const MARKERS: Record<
  Exclude<Point, 'cracking'>,
  { symbol: string; size: number; token: string }
> = {
  yield: { symbol: 'circle', size: 12, token: '--epfl-orange' },
  max: { symbol: 'rect', size: 10, token: '--fg' },
  ultimate: { symbol: 'triangle', size: 13, token: '--epfl-red-dark' }
}

const option = computed<EChartsOption>(() => {
  const map = toAxes(mode.value, props.row)
  const line = (c: Curve) => c.d.map((d, i) => map(d, c.V[i]!))
  const style: Record<Exclude<Layer, 'cycles'>, object> = {
    fd: { color: cssColor('--border-strong'), width: 0.9 },
    envelope: { color: cssColor('--fg'), width: 2 },
    bilinear: { color: cssColor('--primary'), width: 2, type: [6, 4] }
  }
  // A cycle's curve: its envelope or bilinear style, thin and faded.
  const cycleStyle = (f: string) => ({
    ...style[f.startsWith(FOLDERS[method.value].bilinear) ? 'bilinear' : 'envelope'],
    width: 1,
    opacity: 0.5
  })
  const series: SeriesOption[] = []
  for (const l of present.value) {
    if (!layers[l]) continue
    for (const f of layerFiles(method.value, l)) {
      const c = curves.value.get(f)
      if (!c) continue
      series.push({
        type: 'line',
        data: line(c),
        symbol: 'none',
        silent: true,
        lineStyle: l === 'cycles' ? cycleStyle(f) : style[l]
      })
    }
  }
  for (const p of ['yield', 'max', 'ultimate'] as const) {
    if (!shown.value.includes(p)) continue
    const m = MARKERS[p]
    series.push({
      type: 'scatter',
      symbol: m.symbol,
      symbolSize: m.size,
      silent: true,
      itemStyle: {
        color: cssColor(m.token),
        borderColor: cssColor('--epfl-white'),
        borderWidth: 1.5
      },
      data: points.value[p].map(([d, V]) => map(d, V!))
    })
  }
  if (shown.value.includes('cracking')) {
    series.push({
      type: 'line',
      data: [],
      markLine: {
        symbol: 'none',
        silent: true,
        label: { show: false },
        lineStyle: { color: cssColor('--epfl-canard'), type: [3, 3], width: 1.5 },
        data: points.value.cracking.map(([d]) => ({ xAxis: map(d, 0)[0] }))
      }
    })
  }
  // Symmetric axes around the origin, 10 % margin, as in build_charts.py; over
  // both methods, so switching keeps the scale.
  const all = [
    ...[...curves.value.values()].flatMap(line),
    ...METHODS.flatMap((m) => {
      const p = limitPoints(props.row, m)
      return POINTS.flatMap((k) => p[k].map(([d, V]) => map(d, V ?? 0)))
    })
  ]
  const extent = (i: 0 | 1) => Math.max(...all.map((xy) => Math.abs(xy[i])), 1e-3) * 1.1
  const axis = (name: string, max: number) => ({
    type: 'value' as const,
    name,
    nameLocation: 'middle' as const,
    nameGap: 32,
    nameTextStyle: { color: cssColor('--fg-muted'), fontSize: 13 },
    min: -max,
    max,
    axisLine: { lineStyle: { color: cssColor('--border-strong') } },
    axisLabel: {
      color: cssColor('--fg-muted'),
      fontSize: 11,
      showMinLabel: false, // the ±10 % margin, not a round number
      showMaxLabel: false
    },
    splitLine: { lineStyle: { color: cssColor('--border-subtle') } }
  })
  return {
    animation: false,
    textStyle: { fontFamily: getComputedStyle(document.body).fontFamily },
    grid: { left: 64, right: 16, top: 16, bottom: 48 },
    xAxis: axis(t(`specimen.xAxis.${mode.value}`), extent(0)),
    yAxis: axis(t(`specimen.yAxis.${mode.value}`), extent(1)),
    series
  }
})
</script>

<style scoped lang="scss">
.curves {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 17.5rem;
  gap: var(--gutter);
}

.curves-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.curves-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.curves-switches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.curves-layers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.curves-muted {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.layer {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  padding: 0.375rem 0.75rem;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--fg-muted);
  cursor: pointer;
  background: var(--bg-subtle);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);

  &[aria-pressed='true'] {
    color: var(--fg);
    background: var(--bg);
    border-color: var(--fg);
  }

  &[aria-pressed='false'] .line {
    opacity: 0.35;
  }
}

.line {
  display: inline-block;
  width: 1.5rem;
  height: 0;
  vertical-align: middle;
}

.line-fd {
  border-top: var(--border-w) solid var(--border-strong);
}

.line-envelope {
  border-top: 0.125rem solid var(--fg);
}

.line-bilinear {
  border-top: 0.125rem dashed var(--primary);
}

.line-cycles {
  border-top: var(--border-w) solid var(--fg);
  opacity: 0.5;
}

.fd-chart {
  height: 27.5rem;
}

.fd-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0;
  padding: 0 0 0 1.75rem;
  font-size: 0.8125rem;
  color: var(--fg-muted);
  list-style: none;

  li {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
  }
}

.curves-side {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.points {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin: 0;
  padding: 0;
  border: 0;

  legend {
    margin-bottom: 0.75rem;
    padding: 0;
  }
}

.point {
  display: grid;
  grid-template-columns: 1.25rem 1rem minmax(0, 1fr);
  gap: var(--space-2);
  align-items: start;
  font-size: var(--fs-sm);
  cursor: pointer;

  input {
    width: 1rem;
    height: 1rem;
    margin: 0.125rem 0 0;
    accent-color: var(--primary);
  }
}

.keep-case {
  text-transform: none;
}

.point-name,
.point-value {
  display: block;
}

.point-value {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

// The chart's marker shapes, so the list doesn't rely on colour alone.
.marker {
  justify-self: center;
  width: 0.625rem;
  height: 0.625rem;
  margin-top: var(--space-1);
}

.marker-cracking {
  width: 0;
  height: 1rem;
  margin-top: 0;
  border-left: 0.125rem dotted var(--epfl-canard);
}

.marker-yield {
  background: var(--epfl-orange);
  border-radius: 50%;
}

.marker-max {
  background: var(--fg);
}

.marker-ultimate {
  background: var(--epfl-red-dark);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

@media (width <= 64rem) {
  .curves {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
