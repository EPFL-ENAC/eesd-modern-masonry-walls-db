<template>
  <section id="export" class="box box-strong" tabindex="-1" aria-labelledby="export-h">
    <h3 id="export-h" class="box-title">{{ t('export.title') }}</h3>
    <fieldset class="box-set">
      <legend class="box-legend">{{ t('export.specimens') }}</legend>
      <label v-for="s in ['filtered', 'full'] as const" :key="s" class="box-option">
        <input v-model="scope" type="radio" name="export-scope" :value="s" />
        <span class="box-grow">{{ t(`export.${s}`) }}</span>
        <span class="box-count">{{ s === 'full' ? rows.length : filtered.length }}</span>
      </label>
    </fieldset>
    <fieldset class="box-set">
      <legend class="box-legend">{{ t('export.include') }}</legend>
      <!-- handoff-BIB (#18): the .bib joins "references" once EESD supplies it. -->
      <label v-for="k in INCLUDE" :key="k" class="box-option">
        <input v-model="include" type="checkbox" :value="k" />
        {{ t(`export.items.${k}`, { n: fields.length }) }}
      </label>
    </fieldset>
    <button
      type="button"
      class="epfl-btn epfl-btn-primary export-go"
      :disabled="busy || !include.length || !chosen.length"
      @click="download"
    >
      <q-icon :name="matFileDownload" />
      {{ busy ? t('export.busy') : t('export.download', { n: chosen.length }) }}
    </button>
    <p v-if="error" class="export-error" role="alert">{{ error }}</p>
    <p class="box-note">{{ t('export.note') }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { matFileDownload } from '@quasar/extras/material-icons'
import {
  DATABASE_CSV,
  REFERENCES_CSV,
  databaseCsv,
  fetchFile,
  fields,
  rows
} from '../api/dataset.ts'
import { useFilters } from '../composables/useFilters.ts'
import { saveBlob, zip } from '../lib/download.ts'

const { t } = useI18n()
const { filtered } = useFilters()

// Table format (.csv/.xlsx) dropped: CSV only (plan answer D).
const INCLUDE = ['table', 'curves', 'envelopes', 'figures', 'references'] as const
type Include = (typeof INCLUDE)[number]
const FOLDERS: Partial<Record<Include, RegExp>> = {
  curves: /^02_/,
  envelopes: /^0[34]_/,
  figures: /^0[5-8]_/
}

const scope = ref<'filtered' | 'full'>('filtered')
const include = ref<Include[]>(['table', 'references'])
const chosen = computed(() => (scope.value === 'full' ? rows : filtered.value))
const busy = ref(false)
const error = ref('')

async function download() {
  busy.value = true
  error.value = ''
  try {
    const set = chosen.value
    const want = (k: Include) => include.value.includes(k)
    const paths = set
      .flatMap((r) => r.files)
      .filter((p) => INCLUDE.some((k) => want(k) && FOLDERS[k]?.test(p)))
    if (want('references')) paths.push(REFERENCES_CSV)
    const entries: [string, Blob | string][] = await Promise.all(
      paths.map(async (p): Promise<[string, Blob]> => [p, await fetchFile(p)])
    )
    if (want('table')) {
      entries.unshift(
        scope.value === 'full'
          ? [DATABASE_CSV, await fetchFile(DATABASE_CSV)]
          : [
              DATABASE_CSV.replace('.csv', '_filtered.csv'),
              await databaseCsv(new Set(set.map((r) => r.N)))
            ]
      )
    }
    const [only] = entries
    if (entries.length === 1 && only) saveBlob(new Blob([only[1]]), only[0].split('/').pop()!)
    else saveBlob(await zip(entries), `ModernMasonryDatabase_EIA_${set.length}_specimens.zip`)
  } catch (e) {
    error.value = t('export.failed', { reason: (e as Error).message })
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
.export-go {
  justify-content: center;
  width: 100%;
}

.export-error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--danger);
}
</style>
