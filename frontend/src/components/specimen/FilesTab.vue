<template>
  <div class="files">
    <section>
      <div class="files-head">
        <h3 class="section-label">{{ t('specimen.files.raw') }}</h3>
        <button
          type="button"
          class="epfl-btn epfl-btn-primary epfl-btn-sm"
          :disabled="busy"
          @click="all"
        >
          {{ t('specimen.files.all') }}
        </button>
      </div>
      <ul class="files-list">
        <li v-for="p in row.files" :key="p" class="files-row">
          <span>{{ name(p) }}</span>
          <span class="files-desc">{{ t(`specimen.files.desc.${p.split('/')[0]}`) }}</span>
          <a
            :href="fileUrl(p)"
            :download="name(p)"
            :aria-label="t('specimen.files.download', { name: name(p) })"
          >
            <q-icon :name="matFileDownload" size="1.25rem" />
          </a>
        </li>
        <li class="files-row">
          <span>specimen_{{ pad(row.N) }}.csv</span>
          <span class="files-desc">{{ t('specimen.files.desc.row', { n: fields.length }) }}</span>
          <button
            type="button"
            class="files-icon"
            :aria-label="t('specimen.files.download', { name: `specimen_${pad(row.N)}.csv` })"
            @click="run(() => saveSpecimenRow(row))"
          >
            <q-icon :name="matFileDownload" size="1.25rem" />
          </button>
        </li>
      </ul>
      <p v-if="error" class="files-error" role="alert">{{ error }}</p>
    </section>

    <section class="cite">
      <h3 class="section-label">{{ t('specimen.files.citation') }}</h3>
      <!-- handoff-Q7: no citation text for some references (ref 25). -->
      <p class="cite-text">
        {{ reference?.citation ?? t('specimen.files.handoff-Q7-citation') }}
        <a v-if="reference?.linkDocument" :href="reference.linkDocument">{{
          doi(reference.linkDocument)
        }}</a>
      </p>
      <p v-if="reference?.linkData" class="cite-text">
        <a :href="reference.linkData">{{ t('specimen.files.data') }}</a>
      </p>
      <!-- handoff-BIB: BibTeX comes from the EESD .bib, not supplied yet. -->
      <pre class="cite-bib">{{ t('specimen.files.handoff-BIB-pending') }}</pre>
      <div class="cite-actions">
        <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm" disabled>
          {{ t('specimen.files.copyBib') }}
        </button>
        <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm" disabled>
          {{ t('specimen.files.downloadBib') }}
        </button>
      </div>
      <p class="cite-note">{{ t('specimen.files.alsoCite') }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { matFileDownload } from '@quasar/extras/material-icons'
import { fields, fileUrl, referenceById } from '../../api/dataset.ts'
import type { Row } from '../../lib/derive.ts'
import { pad, saveSpecimenRow, saveSpecimenZip } from '../../lib/download.ts'

const props = defineProps<{ row: Row }>()
const { t } = useI18n()

const reference = computed(() => referenceById.get(props.row.reference))
const name = (p: string) => p.split('/').pop()!
const doi = (url: string) => url.replace(/^https?:\/\/(dx\.)?doi\.org\//, 'doi:')

const busy = ref(false)
const error = ref('')
async function run(job: () => Promise<void>) {
  busy.value = true
  error.value = ''
  try {
    await job()
  } catch (e) {
    error.value = t('export.failed', { reason: (e as Error).message })
  } finally {
    busy.value = false
  }
}
const all = () => run(() => saveSpecimenZip(props.row))
</script>

<style scoped lang="scss">
.files {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3rem;
}

.files-head {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  .section-label {
    margin: 0;
  }
}

.files-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: var(--border-w) solid var(--fg);
}

.files-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 1rem;
  align-items: center;
  padding: 0.625rem 0.25rem;
  font-size: var(--fs-sm);
  border-bottom: var(--border-w) solid var(--border-subtle);

  a {
    line-height: 0;
    color: var(--fg);
  }
}

.files-desc {
  color: var(--fg-muted);
}

.files-icon {
  padding: 0;
  line-height: 0;
  color: var(--fg);
  cursor: pointer;
  background: none;
  border: 0;
}

.files-error {
  font-size: 0.75rem;
  color: var(--danger);
}

.cite {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .section-label {
    margin: 0;
  }
}

.cite-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.cite-bib {
  margin: 0;
  padding: 1rem;
  font-size: 0.75rem;
  line-height: 1.55;
  white-space: pre-wrap;
  background: var(--bg-subtle);
  border: var(--border-w) solid var(--border-subtle);
  border-radius: var(--radius);
}

.cite-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cite-note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

@media (width <= 64rem) {
  .files {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
