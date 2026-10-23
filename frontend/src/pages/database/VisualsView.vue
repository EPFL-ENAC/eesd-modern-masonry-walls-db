<template>
  <Teleport defer to="#db-toolbar">
    <span v-for="c in chips" :key="c.label" class="chip">
      {{ c.label }}
      <button
        type="button"
        :aria-label="t('table.removeFilter', { filter: c.label })"
        @click="update(c.patch)"
      >
        <q-icon :name="matClose" />
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

  <!-- The summary and the legend share one line: the four plots fit on a laptop screen. -->
  <div class="vis-legend">
    <p class="vis-stats">
      <i18n-t keypath="visuals.walls" tag="span" scope="global">
        <template #n
          ><b class="vis-num">{{ filtered.length }}</b></template
        >
        <template #total>{{ rows.length }}</template>
        <template #pct>{{ Math.round((filtered.length / rows.length) * 100) }}</template>
      </i18n-t>
      <span v-for="s in stats" :key="s.key" class="vis-stat">
        <i18n-t keypath="visuals.median" tag="span" scope="global">
          <template #symbol><FieldLabel :field="{ name: s.symbol, units: '' }" /></template>
          <template #value
            ><b class="vis-num">{{
              s.n ? s.median.toFixed(2) : t('specimen.missing')
            }}</b></template
          >
        </i18n-t>
        <span v-if="s.n" class="vis-muted">
          {{ t('visuals.iqr', { q1: s.q1.toFixed(2), q3: s.q3.toFixed(2), n: s.n }) }}
        </span>
      </span>
    </p>
    <span class="vis-groups">
      <span class="vis-muted">{{ t('filters.items.fm_group') }}</span>
      <span v-for="[g, n] in groups" :key="g" class="vis-group">
        <span
          class="vis-marker"
          :class="`vis-marker-${g}`"
          :style="{ background: `var(${categoryToken('fm_group', g)})` }"
        />
        {{ g }} · {{ n }}
      </span>
    </span>
  </div>

  <div class="vis-grid">
    <figure v-for="(p, i) in PLOTS" :key="p.id" class="vis-fig">
      <figcaption class="vis-cap">
        <span class="vis-title">{{ t(`visuals.plots.${p.id}`) }}</span>
        <span class="vis-muted">
          {{ t('visuals.n', { n: data[i]!.points.length }) }}
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
  <p class="vis-muted">{{ t('visuals.average') }}</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { matClose } from '@quasar/extras/material-icons'
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

.vis-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--gutter);
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--fs-sm);
}

.vis-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--gutter);
  align-items: baseline;
  margin: 0;
}

.vis-stat {
  display: inline-flex;
  gap: var(--space-2);
  align-items: baseline;
}

.vis-num {
  font-size: var(--fs-h5);
}

.vis-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  align-items: baseline;
}

.vis-muted {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.vis-group {
  display: inline-flex;
  gap: var(--space-2);
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
  gap: var(--space-4) 2.5rem;
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
  gap: var(--space-2);
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.vis-title {
  font-size: 1rem;
  font-weight: var(--w-bold);
}

.vis-plot {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr);
  gap: var(--space-1);
}

.vis-ytitle {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-align: center;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

// Two rows of plots share what the viewport has left under the header and the toolbar.
.vis-chart {
  height: clamp(12rem, calc(50dvh - 12.5rem), 22rem);
}

.vis-jitter {
  margin-left: var(--space-1);
}

.vis-xtitle {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  text-align: center;
}

@media (width <= 48rem) {
  .vis-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
