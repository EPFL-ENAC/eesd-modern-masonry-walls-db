<template>
  <div>
    <section class="page-container intro">
      <div class="intro-text">
        <div class="epfl-eyebrow">{{ t('overview.eyebrow') }}</div>
        <h1 class="intro-title">{{ t('overview.title') }}</h1>
        <p class="intro-lead">
          {{ t('overview.lead', { specimens: rows.length, references: references.length }) }}
        </p>
        <div class="intro-ctas">
          <router-link class="epfl-btn epfl-btn-primary" to="/database">
            {{ t('overview.explore') }}
          </router-link>
          <router-link class="epfl-btn epfl-btn-secondary" to="/documentation">
            {{ t('overview.glossary') }}
          </router-link>
        </div>
      </div>
      <div class="intro-keys">
        <EpflKeyNumber
          v-for="k in keyNumbers"
          :key="k.label"
          :value="k.value"
          :label="t(k.label)"
        />
      </div>
    </section>

    <section class="page-container band" aria-labelledby="contains-h">
      <div class="band-head">
        <h2 id="contains-h" class="band-title">{{ t('overview.contains') }}</h2>
        <p class="band-hint" role="status">
          <template v-if="filtered">
            {{ t('overview.selectedHint', { n: shown.length, total: rows.length }) }}
            <button type="button" class="band-clear" @click="selected = {}">
              {{ t('overview.clear') }}
            </button>
          </template>
          <template v-else>{{ t('overview.selectHint', { n: rows.length }) }}</template>
        </p>
      </div>
      <div class="donuts">
        <DonutFigure
          v-for="d in donuts"
          :key="d.key"
          :title="t(`overview.donuts.${d.key}`)"
          :items="d.items"
          :selected="selected[d.key]"
          @select="toggle(d.key, $event)"
        />
      </div>
    </section>

    <section class="page-container band" aria-labelledby="flow-h">
      <div class="band-head">
        <h2 id="flow-h" class="band-title">{{ t('overview.connect') }}</h2>
        <div class="flow-legend">
          <span class="band-hint">{{ t('overview.colourBy') }}</span>
          <span v-for="[u] in units" :key="u" class="flow-chip">
            <span
              class="flow-swatch"
              :style="{ background: `var(${categoryToken('unit_type', u)})` }"
            />
            {{ u }}
          </span>
        </div>
      </div>
      <p class="flow-help">{{ t('overview.flowHelp') }}</p>
      <div class="flow-scroll">
        <div class="flow">
          <div class="flow-axes" aria-hidden="true">
            <span
              v-for="(a, i) in FLOW_AXES"
              :key="a"
              :style="{ left: `${5 + (i * 90) / (FLOW_AXES.length - 1)}%` }"
            >
              {{ t(`overview.axes.${a}`) }}
            </span>
          </div>
          <VChart
            class="flow-chart"
            :option="flowOption"
            autoresize
            role="img"
            :aria-label="t('overview.flowSummary', { n: shown.length })"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'echarts/core'
import type { EChartsOption } from 'echarts'
import { fields, references, rows } from '../api/dataset.ts'
import { VChart, darkTooltip } from '../charts/echarts.ts'
import { FLOW_AXES, flows, nodeLabel, type Link } from '../charts/sankey.ts'
import { EpflKeyNumber } from 'epfl-design-system/kits/vue'
import DonutFigure from '../components/DonutFigure.vue'
import { NA, counts, type Category } from '../lib/derive.ts'
import { categoryToken, cssColor, cssVar } from '../lib/tokens.ts'

const { t } = useI18n()

const keyNumbers = [
  { value: rows.length, label: 'overview.keySpecimens' },
  { value: references.length, label: 'overview.keyReferences' },
  { value: fields.length, label: 'overview.keyFields' }
]

const label = (key: Category, v: string) =>
  v === NA
    ? t('overview.notReported')
    : key === 'unit_type' || key === 'fm_group'
      ? t(`categories.${v}`)
      : v

const DONUT_KEYS = ['unit_type', 'fm_group', 'bin_H0_H', 'bin_H', 'bin_sigma0'] as const
const donuts = DONUT_KEYS.map((key) => ({
  key,
  items: counts(rows, key).map(([value, count]) => ({
    value,
    count,
    label: label(key, value),
    color: categoryToken(key, value)
  }))
}))
const units = counts(rows, 'unit_type')

// Local page state, not the URL: the selection only filters the flows (HANDOFF §4.1).
const selected = ref<Partial<Record<Category, string>>>({})
const toggle = (key: Category, v: string) => {
  selected.value = { ...selected.value, [key]: selected.value[key] === v ? undefined : v }
}
const filtered = computed(() => Object.values(selected.value).some(Boolean))
const shown = computed(() =>
  rows.filter((r) => Object.entries(selected.value).every(([k, v]) => !v || r[k as Category] === v))
)

function tooltip(params: unknown) {
  const p = params as { dataType?: string; name: string; value: number; data: Link }
  const enc = format.encodeHTML
  if (p.dataType !== 'edge') {
    return `<b>${enc(nodeLabel(p.name))}</b><br>${t('overview.flowNode', { n: p.value })}`
  }
  const { source, target, unit, value } = p.data
  const pct = Math.round((value / shown.value.length) * 100)
  const count = t('overview.flowCount', { n: value, pct })
  const body = source.startsWith('unit_type:') ? count : `${enc(unit)} · ${count}`
  return `<b>${enc(nodeLabel(source))} → ${enc(nodeLabel(target))}</b><br>${body}`
}

const flowOption = computed<EChartsOption>(() => {
  const { nodes, links } = flows(shown.value)
  const fg = cssColor('--fg')
  const white = cssColor('--epfl-white')
  const n = shown.value.length
  return {
    textStyle: { fontFamily: cssVar('--font-sans') },
    tooltip: { ...darkTooltip(), formatter: tooltip },
    series: [
      {
        type: 'sankey',
        left: '5%',
        right: '5%',
        top: 8,
        bottom: 8,
        nodeWidth: 10,
        nodeGap: 8,
        layoutIterations: 0, // keep ORDERS order on every axis
        draggable: false,
        data: nodes.map((node) => ({
          ...node,
          label: node.depth === FLOW_AXES.length - 1 ? { position: 'left' as const } : {}
        })),
        links: links.map((l) => ({
          ...l,
          lineStyle: { color: cssColor(categoryToken('unit_type', l.unit)) }
        })),
        itemStyle: { color: fg, borderWidth: 0 },
        lineStyle: { opacity: 0.42, curveness: 0.5 },
        label: {
          color: fg,
          fontSize: 12,
          fontWeight: 'bold',
          textBorderColor: white,
          textBorderWidth: 3,
          // ponytail: build_charts.py's "label if taller than 9 px", as a share of specimens.
          formatter: (p) => ((p.value as number) / n > 0.025 ? nodeLabel(p.name) : '')
        }
      }
    ]
  }
})
</script>

<style scoped lang="scss">
.intro {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: var(--space-5);
  align-items: end;
  padding-top: 4rem;
  padding-bottom: var(--space-5);
}

.intro-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.intro-title {
  margin: 0;
}

.intro-lead {
  max-width: 42.5rem;
  margin: 0;
  font-size: var(--fs-lead);
  font-weight: var(--w-light);
  line-height: 1.5;
}

.intro-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.intro-keys {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
}

.band {
  padding-top: var(--gutter);
  padding-bottom: var(--space-5);
  border-top: var(--border-w) solid var(--border-subtle);
}

.band-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--gutter);
}

.band-title {
  margin: 0;
  font-size: var(--fs-h3);
  font-weight: var(--w-bold);
  line-height: 1.35;
}

.band-hint {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--fg-muted);
}

.band-clear {
  padding: 0;
  font: inherit;
  color: var(--fg);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: 0;
}

.donuts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-4);
}

.flow-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.flow-chip {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  padding: var(--space-1) 0.625rem;
  font-size: 0.8125rem;
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

.flow-swatch {
  width: 0.5rem;
  height: 0.5rem;
}

.flow-help {
  max-width: 47.5rem;
  margin: calc(-1 * var(--space-4)) 0 var(--space-4);
  color: var(--fg-muted);
}

.flow-scroll {
  overflow-x: auto;
}

.flow {
  min-width: 60rem;
}

.flow-axes {
  position: relative;
  height: 2.5rem;
  font-size: var(--fs-sm);
  font-weight: var(--w-bold);

  span {
    position: absolute;
    white-space: nowrap;
    transform: translateX(-50%);
  }
}

.flow-chart {
  height: 28rem;
}

@media (width <= 64rem) {
  .intro {
    grid-template-columns: minmax(0, 1fr);
  }

  .donuts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
