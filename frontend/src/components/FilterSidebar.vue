<template>
  <aside class="filters" :aria-label="t('filters.title')">
    <div class="filters-head">
      <h2 class="section-label">{{ t('filters.title') }}</h2>
      <button type="button" class="filters-reset" :disabled="!isActive(filters)" @click="reset">
        {{ t('filters.reset') }}
      </button>
    </div>

    <section v-for="g in GROUPS" :key="g.key" class="filters-group">
      <h3 class="filters-group-title">{{ t(`filters.groups.${g.key}`) }}</h3>
      <details
        v-for="item in g.items"
        :key="item.key"
        class="filters-item"
        :open="activeCount(item) > 0"
      >
        <summary>
          <q-icon :name="matChevronRight" class="filters-chev" />
          <span class="filters-item-label">{{ t(`filters.items.${item.key}`) }}</span>
          <span v-if="activeCount(item)" class="filters-badge">{{ activeCount(item) }}</span>
        </summary>
        <div v-if="item.kind === 'list'" class="filters-options">
          <label
            v-for="[value, count] in facet(rows, filters, item.key)"
            :key="value"
            class="filters-option"
          >
            <input
              type="checkbox"
              :checked="filters[item.key].includes(value)"
              @change="toggle(item.key, value)"
            />
            <span class="filters-option-label">{{ optionLabel(item.key, value) }}</span>
            <span class="filters-count">{{ count }}</span>
          </label>
        </div>
        <div v-else class="filters-range">
          <label v-for="end in ['min', 'max'] as const" :key="end">
            {{ t(`filters.${end}`) }}
            <input
              type="number"
              step="0.01"
              class="filters-input"
              :value="filters[`${item.key}_${end}`] ?? ''"
              :placeholder="bounds[item.key][end]"
              @change="setBound(item.key, end, $event)"
            />
          </label>
        </div>
      </details>
    </section>

    <fieldset class="filters-group">
      <legend class="filters-group-title">{{ t('filters.groups.availability') }}</legend>
      <label
        v-for="[value, count] in facet(rows, filters, 'has')"
        :key="value"
        class="filters-option"
      >
        <input
          type="checkbox"
          :checked="filters.has.includes(value)"
          @change="toggle('has', value)"
        />
        <span class="filters-option-label">{{ optionLabel('has', value) }}</span>
        <span class="filters-count">{{ count }}</span>
      </label>
    </fieldset>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { matChevronRight } from '@quasar/extras/material-icons'
import { rows } from '../api/dataset.ts'
import { useFilters } from '../composables/useFilters.ts'
import { RANGES, facet, isActive, type ListKey, type RangeKey } from '../lib/filters.ts'

const { t } = useI18n()
const { filters, update, optionLabel, reset } = useFilters()

type Item = { kind: 'list'; key: Exclude<ListKey, 'has'> } | { kind: 'range'; key: RangeKey }
const list = (key: Exclude<ListKey, 'has'>): Item => ({ kind: 'list', key })
const range = (key: RangeKey): Item => ({ kind: 'range', key })
const GROUPS = [
  { key: 'specimen', items: [list('unit_type'), list('bed'), list('head'), range('h')] },
  { key: 'test', items: [list('h0h'), range('s0')] },
  { key: 'response', items: [list('fm_group')] }
]

// Placeholders: the dataset's own extent.
const bounds = Object.fromEntries(
  (Object.keys(RANGES) as RangeKey[]).map((k) => {
    const v = rows.map(RANGES[k]).filter((x) => !Number.isNaN(x))
    return [k, { min: String(Math.min(...v)), max: String(Math.max(...v)) }]
  })
) as Record<RangeKey, { min: string; max: string }>

const activeCount = (item: Item) =>
  item.kind === 'list'
    ? filters.value[item.key].length
    : +(filters.value[`${item.key}_min`] != null || filters.value[`${item.key}_max`] != null)

function toggle(key: ListKey, v: string) {
  const cur = filters.value[key]
  update({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] })
}

function setBound(key: RangeKey, end: 'min' | 'max', e: Event) {
  const v = (e.target as HTMLInputElement).value
  update({ [`${key}_${end}`]: v === '' ? null : Number(v) })
}
</script>

<style scoped lang="scss">
.filters {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem 1.5rem;
  border-right: var(--border-w) solid var(--border-subtle);
}

.filters-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filters-reset {
  padding: 0.375rem 0.625rem;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--danger-fg);
  cursor: pointer;
  background: var(--bg);
  border: var(--border-w) solid var(--danger-border);
  border-radius: var(--radius);

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}

.filters-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.filters-group-title {
  margin: 0 0 0.25rem;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
}

.filters-item {
  padding: 0.375rem 0 0.625rem;
  border-bottom: var(--border-w) solid var(--border-subtle);

  summary {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    padding: 0.375rem 0;
    font-size: 0.9375rem;
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &[open] .filters-chev {
    transform: rotate(90deg);
  }
}

.filters-item-label {
  flex: 1;
}

.filters-badge {
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: var(--w-bold);
  color: var(--epfl-white);
  background: var(--primary);
  border-radius: var(--radius);
}

.filters-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.375rem 0 0 1.25rem;
}

.filters-option {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: var(--fs-sm);

  input {
    width: 1rem;
    height: 1rem;
    margin: 0;
    accent-color: var(--primary);
  }
}

.filters-option-label {
  flex: 1;
}

.filters-count {
  color: var(--fg-muted);
}

.filters-range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.375rem 0 0 1.25rem;
  font-size: 0.75rem;
  color: var(--fg-muted);
}

.filters-input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.375rem 0.5rem;
  font: inherit;
  font-size: var(--fs-sm);
  color: var(--fg);
  border: var(--border-w) solid var(--border-strong);
  border-radius: var(--radius);
}
</style>
