<template>
  <div class="tbl-box">
    <div class="tbl-scroll">
      <table class="tbl">
        <thead>
          <tr>
            <th
              v-for="(g, i) in groups"
              :key="i"
              class="tg"
              :class="{ fix1: i === 0 }"
              :colspan="g.span"
              scope="colgroup"
            >
              {{ g.cat }}<template v-if="g.name"> · {{ g.name }}</template>
              <span v-if="i === 0" class="tg-fixed">· {{ t('table.fixed') }}</span>
            </th>
          </tr>
          <tr>
            <th
              v-for="(f, i) in columns"
              :key="f.n"
              class="th"
              :class="cellClass(f, i)"
              :aria-sort="
                sort.key === f.name ? (sort.desc ? 'descending' : 'ascending') : undefined
              "
              scope="col"
            >
              <button type="button" class="th-sort" @click="sortBy(f.name)">
                <FieldLabel :field="f" :short="short(f)" units />
                <span v-if="sort.key === f.name" aria-hidden="true">{{
                  sort.desc ? ' ↓' : ' ↑'
                }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in pageRows"
            :key="r.N"
            tabindex="0"
            :class="{ sel: r.N === selected }"
            :aria-selected="r.N === selected"
            @click="open(r.N)"
            @keydown.enter="open(r.N)"
          >
            <td v-for="(f, i) in columns" :key="f.n" class="td" :class="cellClass(f, i)">
              {{ r.values[f.name] ?? '' }}
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td class="td tbl-empty" :colspan="columns.length">{{ t('table.noRows') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="tbl-foot">
      <span>{{ status }}</span>
      <div class="pager">
        <button
          type="button"
          :aria-label="t('table.previous')"
          :disabled="page === 1"
          @click="goto(page - 1)"
        >
          ‹
        </button>
        <button
          v-for="p in pageWindow"
          :key="p"
          type="button"
          :aria-current="p === page ? 'page' : undefined"
          :aria-label="t('table.page', { n: p })"
          @click="goto(p)"
        >
          {{ p }}
        </button>
        <button
          type="button"
          :aria-label="t('table.next')"
          :disabled="page === pages"
          @click="goto(page + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { fields, rows as allRows } from '../api/dataset.ts'
import type { Field } from '../api/types.ts'
import { useFilters } from '../composables/useFilters.ts'
import { num, type Row } from '../lib/derive.ts'
import FieldLabel from './FieldLabel.vue'

const props = defineProps<{ rows: readonly Row[]; visible: readonly string[] }>()
const { t, te } = useI18n()
const route = useRoute()
const { setQuery } = useFilters()

const PAGE_SIZE = 12
// Right-aligned, sorted as numbers: fields whose every value parses as one.
const NUMERIC = new Set(
  fields
    .filter((f) =>
      allRows.every((r) => r.values[f.name] == null || !Number.isNaN(num(r.values[f.name])))
    )
    .map((f) => f.name)
)

const short = (f: Field) => (te(`fieldShort.${f.n}`) ? t(`fieldShort.${f.n}`) : undefined)

// N° and Specimen first (sticky), then the visible fields in database order.
const STICKY = ['N', 'Specimen name']
const columns = computed(() => [
  ...STICKY.map((name) => fields.find((f) => f.name === name)!),
  ...fields.filter((f) => !STICKY.includes(f.name) && props.visible.includes(f.name))
])
// Category header row; the sticky pair is its own group, so "I" may appear twice (named once).
const groups = computed(() => {
  const out = [{ cat: 'I', name: t('fieldCategories.I'), span: 2 }]
  for (const f of columns.value.slice(2)) {
    const last = out[out.length - 1]!
    if (out.length > 1 && last.cat === f.category) last.span++
    else out.push({ cat: f.category, name: f.category === 'I' ? '' : f.categoryName, span: 1 })
  }
  return out
})
const cellClass = (f: Field, i: number) => ({
  num: NUMERIC.has(f.name),
  fix1: i === 0,
  fix2: i === 1
})

const sort = computed(() => {
  const s = typeof route.query.sort === 'string' ? route.query.sort : 'N'
  return s.startsWith('-') ? { key: s.slice(1), desc: true } : { key: s, desc: false }
})
const sorted = computed(() => {
  const { key, desc } = sort.value
  const isNum = NUMERIC.has(key)
  return [...props.rows].sort((a, b) => {
    const x = a.values[key] ?? null
    const y = b.values[key] ?? null
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1 // missing last
    const c = isNum ? num(x) - num(y) : x.localeCompare(y)
    return desc ? -c : c
  })
})
function sortBy(key: string) {
  const next = sort.value.key === key && !sort.value.desc ? `-${key}` : key
  setQuery({ sort: next === 'N' ? undefined : next, page: undefined })
}

const pages = computed(() => Math.max(1, Math.ceil(props.rows.length / PAGE_SIZE)))
const page = computed(() => Math.min(pages.value, Math.max(1, Number(route.query.page) || 1)))
const pageRows = computed(() =>
  sorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)
const pageWindow = computed(() => {
  const lo = Math.max(1, Math.min(page.value - 2, pages.value - 4))
  return Array.from({ length: Math.min(5, pages.value) }, (_, i) => lo + i)
})
const goto = (p: number) => setQuery({ page: p === 1 ? undefined : String(p) })

const status = computed(() => {
  const n = props.rows.length
  const f = fields.find((x) => x.name === sort.value.key)
  const field = f ? (short(f) ?? f.name) : sort.value.key
  const from = n ? (page.value - 1) * PAGE_SIZE + 1 : 0
  const to = Math.min(n, page.value * PAGE_SIZE)
  return t(sort.value.desc ? 'table.rowsDesc' : 'table.rows', { from, to, n, field })
})

const selected = computed(() => Number(route.query.specimen))
const open = (N: number) => setQuery({ specimen: String(N) })
</script>

<style scoped lang="scss">
.tbl-box {
  min-width: 0;
  border: var(--border-w) solid var(--border);
}

.tbl-scroll {
  overflow-x: auto;
}

.tbl {
  width: 100%;
  border-spacing: 0;
  border-collapse: separate;
}

.tg {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: var(--w-normal);
  color: var(--fg-muted);
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  background: var(--bg);
  border-bottom: var(--border-w) solid var(--border);
  border-left: var(--border-w) solid var(--border);

  &:first-child {
    border-left: 0;
  }
}

.tg-fixed {
  color: var(--epfl-gray-300);
  text-transform: none;
  letter-spacing: 0;
}

.th {
  padding: 0;
  text-align: left;
  font-size: 0.8125rem;
  white-space: nowrap;
  background: var(--bg-subtle);
  border-bottom: var(--border-w) solid var(--border-strong);
}

.th-sort {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font: inherit;
  font-weight: var(--w-bold);
  color: var(--fg);
  text-align: inherit;
  cursor: pointer;
  background: none;
  border: 0;
}

.td {
  padding: 0.5625rem 0.75rem;
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  background: var(--bg);
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.num {
  text-align: right;
}

// N° and Specimen stay put on horizontal scroll.
.fix1,
.fix2 {
  position: sticky;
  z-index: 1;
}

.fix1 {
  left: 0;
  box-sizing: border-box;
  width: 3.5rem;
  min-width: 3.5rem;
}

.fix2 {
  left: 3.5rem;
  border-right: var(--border-w) solid var(--border);
}

.th.fix1 {
  text-align: left;
}

tbody tr {
  cursor: pointer;

  &:hover .td {
    background: var(--bg-subtle);
  }

  &.sel .td {
    background: var(--danger-bg);
  }

  &.sel .fix1,
  &.sel .fix2 {
    font-weight: var(--w-bold);
  }

  &.sel .fix1 {
    box-shadow: inset 0.1875rem 0 0 var(--primary);
  }
}

.tbl-empty {
  color: var(--fg-muted);
  text-align: center;
  cursor: default;
}

.tbl-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--fg-muted);
  border-top: var(--border-w) solid var(--border);
}

.pager {
  display: flex;
  gap: 0.25rem;

  button {
    min-width: 2rem;
    height: 2rem;
    font: inherit;
    color: var(--fg);
    cursor: pointer;
    background: var(--bg);
    border: var(--border-w) solid var(--epfl-gray-300);
    border-radius: var(--radius);

    &[aria-current='page'] {
      font-weight: var(--w-bold);
      color: var(--epfl-white);
      background: var(--fg);
      border-color: var(--fg);
    }

    &:disabled {
      color: var(--epfl-gray-300);
      cursor: default;
      background: var(--border-subtle);
    }
  }
}
</style>
