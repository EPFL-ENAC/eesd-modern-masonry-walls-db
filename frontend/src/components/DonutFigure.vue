<template>
  <figure class="donut">
    <figcaption class="donut-title">{{ title }}</figcaption>
    <div class="donut-chart">
      <VChart :option="option" autoresize role="img" :aria-label="summary" @click="onClick" />
      <div class="donut-centre" aria-hidden="true">
        <span class="donut-share">{{ share }}%</span>
        <span class="donut-value">{{ centre?.value }}</span>
      </div>
    </div>
    <ul class="donut-legend">
      <li v-for="item in items" :key="item.value">
        <button
          type="button"
          class="donut-item"
          :class="{ dim: selected && selected !== item.value }"
          :aria-pressed="selected === item.value"
          @click="emit('select', item.value)"
        >
          <span class="donut-swatch" :style="{ background: `var(${item.color})` }" />
          <span class="donut-label">{{ item.label }}</span>
          <span class="donut-count">{{ item.count }}</span>
        </button>
      </li>
    </ul>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ECElementEvent, EChartsOption } from 'echarts'
import { VChart } from '../charts/echarts.ts'
import { cssColor } from '../lib/tokens.ts'

export type DonutItem = { value: string; label: string; count: number; color: string }

const props = defineProps<{ title: string; items: DonutItem[]; selected?: string }>()
const emit = defineEmits<{ select: [value: string] }>()

const total = computed(() => props.items.reduce((s, i) => s + i.count, 0))
// Centre: the selected segment, else the largest one (HANDOFF §4.1).
const centre = computed(
  () =>
    props.items.find((i) => i.value === props.selected) ??
    props.items.reduce((a, b) => (b.count > a.count ? b : a))
)
const share = computed(() => Math.round(((centre.value?.count ?? 0) / total.value) * 100))
const summary = computed(
  () => `${props.title}: ${props.items.map((i) => `${i.label} ${i.count}`).join(', ')}`
)

const option = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'pie',
      radius: ['57%', '83%'],
      padAngle: 1,
      label: { show: false },
      emphasis: { scale: false }, // DS: hover never lifts
      data: props.items.map((i) => ({
        name: i.value,
        value: i.count,
        itemStyle: {
          color: cssColor(i.color),
          opacity: props.selected && props.selected !== i.value ? 0.3 : 1
        }
      }))
    }
  ]
}))

const onClick = (e: ECElementEvent) => emit('select', e.name)
</script>

<style scoped lang="scss">
.donut {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
}

.donut-title {
  font-size: var(--fs-h6);
  font-weight: var(--w-bold);
}

.donut-chart {
  position: relative;
  max-width: 12.5rem;
  aspect-ratio: 1;
}

.donut-centre {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.donut-share {
  font-size: 1.875rem;
  font-weight: var(--w-light);
  line-height: 1.2;
}

.donut-value {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.donut-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  padding: 0;
  font: inherit;
  font-size: var(--fs-sm);
  color: var(--fg);
  text-align: left;
  cursor: pointer;
  background: none;
  border: 0;

  &.dim {
    color: var(--fg-muted);
  }

  &:hover .donut-label {
    text-decoration: underline;
  }
}

.donut-swatch {
  flex: none;
  width: 0.625rem;
  height: 0.625rem;
}

.donut-label {
  flex: 1;
}

.donut-count {
  color: var(--fg-muted);
}
</style>
