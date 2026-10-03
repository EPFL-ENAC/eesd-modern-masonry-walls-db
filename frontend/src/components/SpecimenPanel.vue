<template>
  <section class="panel" :aria-label="t('specimen.label', { name: row.specimen })">
    <div class="panel-head">
      <div class="panel-cell">
        <div class="panel-eyebrow">{{ t('specimen.eyebrow', { n: row.N }) }}</div>
        <div class="panel-name">{{ row.specimen }}</div>
      </div>
      <div class="panel-cell">
        <div class="panel-eyebrow">{{ t('specimen.reference') }}</div>
        <div class="panel-ref">
          <span class="panel-value">{{ row.reference }}</span>
          <button type="button" class="panel-copy" @click="copyLink">
            <q-icon :name="matLink" />
            {{ copied ? t('specimen.copied') : t('specimen.copyLink') }}
          </button>
        </div>
      </div>
      <div class="panel-cell">
        <div class="panel-eyebrow">{{ t('filters.items.unit_type') }}</div>
        <div class="panel-value">{{ t(`categories.${row.unit_type}`) }}</div>
      </div>
      <div class="panel-cell panel-actions">
        <button
          type="button"
          class="epfl-btn epfl-btn-primary epfl-btn-sm"
          :disabled="busy"
          @click="downloadAll"
        >
          <q-icon :name="matFileDownload" />
          {{ t('specimen.downloadAll') }}
        </button>
        <button
          type="button"
          class="panel-close"
          :aria-label="t('specimen.closePanel')"
          @click="close"
        >
          <q-icon :name="matClose" size="1.25rem" />
        </button>
      </div>
    </div>
    <p v-if="error" class="panel-error" role="alert">{{ error }}</p>

    <div role="tablist" :aria-label="t('specimen.views')" class="panel-tabs" @keydown="onKey">
      <button
        v-for="id in TABS"
        :id="`tab-${id}`"
        :key="id"
        type="button"
        role="tab"
        class="panel-tab"
        :aria-selected="tab === id"
        :aria-controls="`tabpanel-${id}`"
        :tabindex="tab === id ? 0 : -1"
        @click="select(id)"
      >
        {{ t(`specimen.tabs.${id}`) }}
      </button>
    </div>
    <div :id="`tabpanel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`" class="panel-body">
      <CurvesTab v-if="tab === 'curves'" :row="row" />
      <GalleryTab v-else-if="tab === 'gallery'" :row="row" />
      <DataTab v-else-if="tab === 'data'" :row="row" />
      <FilesTab v-else :row="row" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { matClose, matFileDownload, matLink } from '@quasar/extras/material-icons'
import { useFilters } from '../composables/useFilters.ts'
import type { Row } from '../lib/derive.ts'
import { saveSpecimenZip } from '../lib/download.ts'
import CurvesTab from './specimen/CurvesTab.vue'
import DataTab from './specimen/DataTab.vue'
import FilesTab from './specimen/FilesTab.vue'
import GalleryTab from './specimen/GalleryTab.vue'

const props = defineProps<{ row: Row }>()
const { t } = useI18n()
const route = useRoute()
const { setQuery } = useFilters()

const TABS = ['curves', 'gallery', 'data', 'files'] as const
type Tab = (typeof TABS)[number]
const tab = computed<Tab>(() => TABS.find((x) => x === route.query.tab) ?? 'curves')
const select = (id: Tab) => setQuery({ tab: id === 'curves' ? undefined : id })

// ARIA tabs: arrows, Home and End move between tabs.
async function onKey(e: KeyboardEvent) {
  const i = TABS.indexOf(tab.value)
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key]
  if (next == null) return
  e.preventDefault()
  await select(TABS[(next + TABS.length) % TABS.length]!)
  await nextTick()
  document.getElementById(`tab-${tab.value}`)?.focus()
}

const close = () => setQuery({ specimen: undefined, tab: undefined })

const copied = ref(false)
async function copyLink() {
  await navigator.clipboard.writeText(location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const busy = ref(false)
const error = ref('')
async function downloadAll() {
  busy.value = true
  error.value = ''
  try {
    await saveSpecimenZip(props.row)
  } catch (e) {
    error.value = t('export.failed', { reason: (e as Error).message })
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
.panel {
  display: flex;
  flex-direction: column;
  border: var(--border-w) solid var(--border);
}

.panel-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr) auto;
  border-bottom: var(--border-w) solid var(--border);
}

.panel-cell {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem 1.25rem;
  border-right: var(--border-w) solid var(--border-subtle);
}

.panel-eyebrow {
  font-size: 0.75rem;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.panel-name {
  font-size: 1.5rem;
  font-weight: var(--w-bold);
  line-height: 1.1;
}

.panel-value {
  font-size: 1rem;
}

.panel-ref {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.panel-copy {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--fg);
  cursor: pointer;
  background: var(--bg);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

.panel-actions {
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  border-right: 0;
}

.panel-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--fg);
  cursor: pointer;
  background: var(--bg);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

.panel-error {
  margin: 0;
  padding: 0.5rem 1.25rem;
  font-size: 0.75rem;
  color: var(--danger);
}

.panel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0 1.25rem;
  border-bottom: var(--border-w) solid var(--border-subtle);
}

.panel-tab {
  margin: 0 1.25rem calc(-1 * var(--border-w)) 0;
  padding: 1rem 0.25rem 0.8125rem;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
  cursor: pointer;
  background: none;
  border: 0;
  border-bottom: 0.1875rem solid transparent;

  &[aria-selected='true'] {
    color: var(--fg);
    border-bottom-color: var(--primary);
  }
}

.panel-body {
  padding: 1.5rem 1.25rem;
}

@media (width <= 64rem) {
  .panel-head {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
