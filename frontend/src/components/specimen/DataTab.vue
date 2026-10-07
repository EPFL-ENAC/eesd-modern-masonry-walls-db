<template>
  <div>
    <div class="data-head">
      <p class="data-intro">{{ t('specimen.data.intro', { n: fields.length }) }}</p>
      <router-link :to="{ path: '/documentation', hash: '#glossary' }">{{
        t('specimen.data.glossary')
      }}</router-link>
    </div>
    <div class="data-cols">
      <section v-for="c in categories" :key="c.cat" class="data-cat">
        <h3 class="data-cat-title">{{ c.cat }} · {{ c.name }}</h3>
        <FieldRows :row="row" :names="c.names" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { fields } from '../../api/dataset.ts'
import type { Row } from '../../lib/derive.ts'
import FieldRows from './FieldRows.vue'

defineProps<{ row: Row }>()
const { t } = useI18n()

const categories = [...new Set(fields.map((f) => f.category))].map((cat) => {
  const of = fields.filter((f) => f.category === cat)
  return { cat, name: of[0]!.categoryName, names: of.map((f) => f.name) }
})
</script>

<style scoped lang="scss">
.data-head {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  font-size: var(--fs-sm);
}

.data-intro {
  margin: 0;
  color: var(--fg-muted);
}

// 3 columns of key/value rows; a category never splits across columns.
.data-cols {
  column-gap: var(--gutter);
  column-count: 3;
}

.data-cat {
  margin-bottom: var(--space-4);
  break-inside: avoid;
}

.data-cat-title {
  margin: 0 0 0.375rem;
  font-size: 0.8125rem;
  font-weight: var(--w-bold);
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (width <= 64rem) {
  .data-cols {
    column-count: 1;
  }
}
</style>
