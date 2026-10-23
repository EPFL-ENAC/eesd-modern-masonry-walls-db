<template>
  <Teleport defer to="#db-toolbar">
    <input
      type="search"
      class="db-search"
      :placeholder="t('table.search')"
      :aria-label="t('table.search')"
      :value="filters.q"
      @input="update({ q: ($event.target as HTMLInputElement).value })"
    />
    <button type="button" class="epfl-btn epfl-btn-secondary epfl-btn-sm">
      <q-icon :name="matViewColumn" />
      {{ t('columns.button', { shown: visible.length, total: fields.length }) }}
      <q-menu
        role="dialog"
        :aria-label="t('columns.title')"
        anchor="bottom right"
        self="top right"
        :offset="[0, 4]"
      >
        <ColumnsBox v-model="visible" />
      </q-menu>
    </button>
    <button
      type="button"
      class="epfl-btn epfl-btn-secondary epfl-btn-sm"
      aria-haspopup="dialog"
      @click="exporting = true"
    >
      <q-icon :name="matFileDownload" />
      {{ t('table.export') }}
    </button>
  </Teleport>
  <ModalDialog v-model="exporting" :label="t('export.title')">
    <ExportBox @close="exporting = false" />
  </ModalDialog>

  <div class="status">
    <i18n-t keypath="table.count" tag="span" scope="global">
      <template #n
        ><b>{{ filtered.length }}</b></template
      >
      <template #total>{{ rows.length }}</template>
    </i18n-t>
    <template v-if="chips.length">
      <span class="status-sep" aria-hidden="true">|</span>
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
    </template>
    <span class="status-hint">{{ t('table.hint') }}</span>
  </div>

  <SpecimenTable :rows="filtered" :visible="visible" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { matClose, matFileDownload, matViewColumn } from '@quasar/extras/material-icons'
import { fields, rows } from '../../api/dataset.ts'
import ColumnsBox from '../../components/ColumnsBox.vue'
import ExportBox from '../../components/ExportBox.vue'
import ModalDialog from '../../components/ModalDialog.vue'
import SpecimenTable from '../../components/SpecimenTable.vue'
import { useFilters } from '../../composables/useFilters.ts'

const { t } = useI18n()
const { filters, filtered, update, chips } = useFilters()
const exporting = ref(false)

// Default columns (#32), local state, not the URL. Bilinear: Pavia's [VI], the curves' default.
const visible = ref([
  ...['N', 'Reference', 'Specimen name'],
  ...['Unit type', 'H', 'L', 't'],
  ...['fb,norm,Ʇ', 'fm,c'],
  ...['Boundary conditions', 'H0/H', 'σ0', 'ALR'],
  'Failure mode',
  ...['Vbil+', 'Vbil-', 'μu+', 'μu-']
])
</script>

<style scoped lang="scss">
.db-search {
  width: 16.25rem;
  max-width: 100%;
  padding: 0.4375rem 0.625rem;
  font: inherit;
  font-size: var(--fs-sm);
  border: var(--border-w) solid var(--epfl-gray-300);
  border-radius: var(--radius);
}

.status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: var(--fs-sm);
}

.status-sep {
  color: var(--epfl-gray-300);
}

.status-hint {
  margin-left: auto;
  color: var(--fg-muted);
}
</style>
