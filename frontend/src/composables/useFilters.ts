import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { rows } from '../api/dataset.ts'
import { NA } from '../lib/derive.ts'
import {
  LISTS,
  RANGES,
  applyFilters,
  filtersToQuery,
  parseFilters,
  type Filters,
  type ListKey,
  type RangeKey
} from '../lib/filters.ts'

type Patch = Record<string, string | undefined>

/** Filters live in the URL query, shared by /database and /database/visuals. */
export function useFilters() {
  const route = useRoute()
  const router = useRouter()
  const filters = computed(() => parseFilters(route.query))
  const filtered = computed(() => applyFilters(rows, filters.value))
  /** Merge keys into the query; undefined removes a key. */
  const setQuery = (patch: Patch) => router.replace({ query: { ...route.query, ...patch } })
  /** Change filters; the table goes back to its first page. */
  const update = (patch: Partial<Filters>) =>
    setQuery({ ...filtersToQuery({ ...filters.value, ...patch }), page: undefined })

  const { t } = useI18n()
  function optionLabel(key: ListKey, v: string) {
    if (v === NA) return t('filters.notReported')
    if (key === 'bed' || key === 'head') return t(`joints.${v}`)
    if (key === 'fm_group') return t(`categories.${v}`)
    if (key === 'has') return t(`filters.has.${v}`)
    return v
  }

  /** One removable chip per active value, range and search. */
  const chips = computed(() => {
    const f = filters.value
    const out: { label: string; patch: Partial<Filters> }[] = []
    if (f.q) out.push({ label: t('filters.search', { q: f.q }), patch: { q: '' } })
    for (const key of Object.keys(LISTS) as ListKey[]) {
      for (const v of f[key]) {
        out.push({
          label: `${t(`filters.items.${key}`)}: ${optionLabel(key, v)}`,
          patch: { [key]: f[key].filter((x) => x !== v) }
        })
      }
    }
    for (const key of Object.keys(RANGES) as RangeKey[]) {
      const min = f[`${key}_min`]
      const max = f[`${key}_max`]
      if (min == null && max == null) continue
      const range = t('filters.range', { min: min ?? '…', max: max ?? '…' })
      out.push({
        label: `${t(`filters.items.${key}`)}: ${range}`,
        patch: { [`${key}_min`]: null, [`${key}_max`]: null }
      })
    }
    return out
  })

  const reset = () => update(parseFilters({}))

  return { filters, filtered, update, setQuery, optionLabel, chips, reset }
}
