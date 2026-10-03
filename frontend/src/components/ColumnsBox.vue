<template>
  <aside class="box" :aria-label="t('columns.title')">
    <h3 class="box-title">{{ t('columns.title') }}</h3>
    <details v-for="c in categories" :key="c.cat" class="cols-cat">
      <summary class="box-option">
        <input
          type="checkbox"
          :checked="c.shown === c.fields.length"
          :indeterminate="c.shown > 0 && c.shown < c.fields.length"
          :disabled="c.cat === 'I'"
          :aria-label="
            t('columns.category', { name: label(c.cat), shown: c.shown, total: c.fields.length })
          "
          @change="toggle(c.fields, c.shown < c.fields.length)"
        />
        <span class="box-grow">{{ label(c.cat) }}</span>
        <span class="box-count">{{ c.shown }}/{{ c.fields.length }}</span>
        <q-icon :name="matExpandMore" class="cols-chev" />
      </summary>
      <div class="cols-fields">
        <label v-for="f in c.fields" :key="f.n" class="box-option">
          <input
            type="checkbox"
            :checked="model.includes(f.name)"
            :disabled="c.cat === 'I'"
            @change="toggle([f], !model.includes(f.name))"
          />
          <FieldLabel :field="f" />
        </label>
      </div>
    </details>
    <button
      type="button"
      class="epfl-btn epfl-btn-secondary epfl-btn-sm"
      @click="model = fields.map((f) => f.name)"
    >
      {{ t('columns.showAll', { n: fields.length }) }}
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { matExpandMore } from '@quasar/extras/material-icons'
import { fields } from '../api/dataset.ts'
import type { Field } from '../api/types.ts'
import FieldLabel from './FieldLabel.vue'

const model = defineModel<string[]>({ required: true })
const { t } = useI18n()

const label = (cat: string) => `${cat} · ${t(`fieldCategories.${cat}`)}`
const categories = computed(() =>
  [...new Set(fields.map((f) => f.category))].map((cat) => {
    const of = fields.filter((f) => f.category === cat)
    return { cat, fields: of, shown: of.filter((f) => model.value.includes(f.name)).length }
  })
)

function toggle(of: Field[], show: boolean) {
  const names = of.map((f) => f.name)
  model.value = show
    ? [...new Set([...model.value, ...names])]
    : model.value.filter((n) => !names.includes(n))
}
</script>

<style scoped lang="scss">
.cols-cat {
  summary {
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &[open] .cols-chev {
    transform: rotate(180deg);
  }
}

.cols-fields {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem 0 0.25rem 1.5rem;
  font-size: 0.8125rem;
}
</style>
