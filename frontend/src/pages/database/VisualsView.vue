<template>
  <Teleport defer to="#db-toolbar">
    <span v-for="c in chips" :key="c.label" class="chip">
      {{ c.label }}
      <button
        type="button"
        :aria-label="t('table.removeFilter', { filter: c.label })"
        @click="update(c.patch)"
      >
        ×
      </button>
    </span>
    <button
      type="button"
      class="epfl-btn epfl-btn-secondary epfl-btn-sm"
      :disabled="busy"
      @click="exportSvg"
    >
      {{ t('visuals.export') }}
    </button>
  </Teleport>
  <p v-if="error" class="vis-error" role="alert">{{ error }}</p>

  <section class="box vis-summary" aria-labelledby="sum-h">
    <h2 id="sum-h" class="section-label">{{ t('visuals.summary') }}</h2>
    <div class="vis-keys">
      <div>
        <div class="vis-key-title">{{ t('visuals.filtered') }}</div>
        <div class="epfl-keynumber">
          <div class="epfl-keynumber-num">
            {{ filtered.length }}<span class="vis-unit"> / {{ rows.length }}</span>
          </div>
          <div class="epfl-keynumber-bar"></div>
          <div class="epfl-keynumber-label">
            {{ t('visuals.share', { pct: Math.round((filtered.length / rows.length) * 100) }) }}
          </div>
        </div>
      </div>
      <div v-for="s in stats" :key="s.key">
        <div class="vis-key-title">
          {{ t(`visuals.${s.key}`) }}, <FieldLabel :field="{ name: s.symbol, units: '' }" />
        </div>
        <div class="epfl-keynumber">
          <div class="epfl-keynumber-num">
            {{ s.n ? s.median.toFixed(2) : t('specimen.missing') }}<span class="vis-unit"> %</span>
          </div>
          <div class="epfl-keynumber-bar"></div>
          <div class="epfl-keynumber-label">
            {{ t('visuals.iqr', { q1: s.q1.toFixed(2), q3: s.q3.toFixed(2), n: s.n }) }}
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="vis-legend">
    <span class="vis-muted">{{ t('filters.items.fm_group') }}</span>
    <span v-for="[g, n] in groups" :key="g" class="vis-group">
      <span
        class="vis-marker"
        :class="`vis-marker-${g}`"
        :style="{ background: `var(${categoryToken('fm_group', g)})` }"
      />
      {{ g }} · {{ n }}
    </span>
    <span class="vis-muted vis-note">{{ t('visuals.average') }}</span>
  </div>

  <div class="vis-grid">
    <figure v-for="(p, i) in PLOTS" :key="p.id" class="vis-fig">
      <figcaption class="vis-cap">
        <span class="vis-title">{{ t(`visuals.plots.${p.id}`) }}</span>
        <span class="vis-muted">
          n = {{ data[i]!.points.length }}
          <template v-if="data[i]!.missingX">
            · <FieldLabel :field="p.x" /> {{ t('visuals.missing', { n: data[i]!.missingX }) }}
          </template>
          <template v-if="data[i]!.missingY">
            · <FieldLabel :field="p.y" /> {{ t('visuals.missing', { n: data[i]!.missingY }) }}
          </template>
        </span>
      </figcaption>
      <div class="vis-plot">
        <div class="vis-ytitle"><FieldLabel :field="p.y" units /></div>
        <VChart
          class="vis-chart"
          :option="option(p, data[i]!)"
          autoresize
          role="img"
          :aria-label="
            t('visuals.chartLabel', {
              title: t(`visuals.plots.${p.id}`),
              n: data[i]!.points.length
            })
          "
          @click="(e: ECElementEvent) => open(e.value)"
        />
      </div>
      <div class="vis-xtitle">
        <FieldLabel :field="p.x" units />
        <span v-if="p.jitter" class="vis-jitter">{{ t('visuals.jittered') }}</span>
      </div>
    </figure>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { format, init } from 'echarts/core'
import type { ECElementEvent, EChartsOption } from 'echarts'
import { rows } from '../../api/dataset.ts'
import { VChart, darkTooltip } from '../../charts/echarts.ts'
import { PLOTS, scatterData, type Axis, type Plot } from '../../charts/scatter.ts'
import FieldLabel from '../../components/FieldLabel.vue'
import { useFilters } from '../../composables/useFilters.ts'
import { ORDERS, counts, medianIqr } from '../../lib/derive.ts'
import { saveBlob, zip } from '../../lib/download.ts'
import { categoryToken, cssColor } from '../../lib/tokens.ts'

const { t } = useI18n()
const { filtered, update, chips, setQuery } = useFilters()

// Medians over the filtered walls; ± directions averaged (HANDOFF §6.1).
const stats = computed(() =>
  (['drift_peak', 'drift_u'] as const).map((key) => ({
    key,
    symbol: key === 'drift_peak' ? 'δpeak' : 'δu',
    ...medianIqr(filtered.value.map((r) => r[key]))
  }))
)
const groups = computed(() => counts(filtered.value, 'fm_group'))
const data = computed(() => PLOTS.map((p) => scatterData(filtered.value, p)))

// Failure modes keep a shape each, so the plots don't rely on colour alone.
const SYMBOL: Record<string, string> = {
  Shear: 'circle',
  Hybrid: 'rect',
  Flexure: 'triangle',
  Other: 'diamond'
}
const plain = (a: Axis) => `${a.name} ${a.units}`

function option(p: Plot, d: ReturnType<typeof scatterData>, svg = false): EChartsOption {
  const axis = {
    type: 'value' as const,
    axisLine: { show: true, lineStyle: { color: cssColor('--border-strong') } },
    axisLabel: { color: cssColor('--fg-muted'), fontSize: 11 },
    splitLine: { lineStyle: { color: cssColor('--border-subtle') } },
    nameLocation: 'middle' as const,
    nameTextStyle: { color: cssColor('--fg-muted'), fontSize: 12 }
  }
  return {
    animation: !svg,
    textStyle: { fontFamily: getComputedStyle(document.body).fontFamily },
    grid: svg
      ? { left: 64, right: 16, top: 12, bottom: 48 }
      : { left: 44, right: 12, top: 12, bottom: 28 },
    tooltip: svg ? undefined : { ...darkTooltip(), formatter: tip(p) },
    // The SVG export carries its own axis titles; on screen they are HTML, with subscripts.
    xAxis: { ...axis, scale: true, name: svg ? plain(p.x) : undefined, nameGap: 28 },
    yAxis: { ...axis, min: 0, name: svg ? plain(p.y) : undefined, nameGap: 44 },
    series: ORDERS.fm_group.map((g) => ({
      type: 'scatter' as const,
      name: g,
      symbol: SYMBOL[g],
      symbolSize: g === 'Shear' ? 9 : 10,
      cursor: 'pointer',
      itemStyle: {
        color: cssColor(categoryToken('fm_group', g)),
        opacity: 0.85,
        borderColor: cssColor('--epfl-white'),
        borderWidth: 0.8
      },
      data: d.points
        .filter((pt) => pt.row.fm_group === g)
        .map((pt) => ({ name: pt.row.specimen, value: [pt.x, pt.y, pt.row.N] }))
    }))
  }
}

/** Hover: the specimen and its unjittered values. */
const tip = (p: Plot) => (params: unknown) => {
  const { name, value } = params as { name: string; value: [number, number, number] }
  const r = filtered.value.find((x) => x.N === value[2])!
  const v = (a: Axis) => `${format.encodeHTML(plain(a))}: ${+r[a.key].toFixed(3)}`
  return `<b>${t('visuals.tip', { n: value[2], name: format.encodeHTML(name) })}</b><br>${v(p.x)}<br>${v(p.y)}`
}

// Click a point to open its specimen panel.
const open = (value: unknown) => setQuery({ specimen: String((value as number[])[2]) })

const busy = ref(false)
const error = ref('')
async function exportSvg() {
  busy.value = true
  error.value = ''
  try {
    const files = PLOTS.map((p, i): [string, string] => {
      const chart = init(null, undefined, { renderer: 'svg', ssr: true, width: 640, height: 400 })
      chart.setOption(option(p, data.value[i]!, true))
      const svg = chart.renderToSVGString()
      chart.dispose()
      return [`${p.id}.svg`, svg]
    })
    saveBlob(await zip(files), 'ModernMasonryDatabase_figures.zip')
  } catch (e) {
    error.value = t('export.failed', { reason: (e as Error).message })
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
.vis-error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--danger);
}

.vis-summary {
  gap: 1.25rem;
  padding: 1.5rem 1.75rem;

  .section-label {
    margin: 0;
  }
}

.vis-keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
}

.vis-key-title {
  margin-bottom: 0.5rem;
  font-size: var(--fs-sm);
  color: var(--fg-muted);
}

.vis-unit {
  font-size: 1.5rem;
  color: var(--fg-muted);
}

.vis-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: center;
  font-size: var(--fs-sm);
}

.vis-muted {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.vis-note {
  margin-left: auto;
  font-size: var(--fs-sm);
}

.vis-group {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.vis-marker {
  width: 0.625rem;
  height: 0.625rem;
}

.vis-marker-Shear {
  border-radius: 50%;
}

.vis-marker-Flexure {
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.vis-marker-Other {
  transform: rotate(45deg) scale(0.8);
}

.vis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem 2.5rem;
}

.vis-fig {
  min-width: 0;
  margin: 0;
  padding-top: 0.75rem;
  border-top: var(--border-w) solid var(--fg);
}

.vis-cap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.vis-title {
  font-size: 1rem;
  font-weight: var(--w-bold);
}

.vis-plot {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr);
  gap: 0.25rem;
}

.vis-ytitle {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-align: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.vis-chart {
  height: 20rem;
}

.vis-jitter {
  margin-left: 0.25rem;
}

.vis-xtitle {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-align: center;
}

@media (width <= 80rem) {
  .vis-grid,
  .vis-keys {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
