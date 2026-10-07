<template>
  <dl class="kv">
    <div v-for="f in list" :key="f.n" class="kv-row">
      <dt><FieldLabel :field="f" units /></dt>
      <dd>{{ row.values[f.name] ?? t('specimen.missing') }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fields } from '../../api/dataset.ts'
import type { Row } from '../../lib/derive.ts'
import FieldLabel from '../FieldLabel.vue'

const props = defineProps<{ row: Row; names: readonly string[] }>()
const { t } = useI18n()
const list = computed(() => props.names.map((n) => fields.find((f) => f.name === n)!))
</script>
