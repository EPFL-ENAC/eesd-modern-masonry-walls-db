<template>
  <div class="page-container others">
    <section class="others-intro">
      <div class="others-text">
        <div class="epfl-eyebrow">{{ t('others.eyebrow') }}</div>
        <h1 class="others-title">{{ t('others.title') }}</h1>
        <p class="others-lead">{{ t('others.lead') }}</p>
      </div>
      <div class="others-all">
        <a class="epfl-btn epfl-btn-secondary" :href="EESD_DATA">
          {{ t('others.all') }}
          <q-icon :name="matOpenInNew" />
        </a>
      </div>
    </section>

    <section aria-labelledby="sis-h" class="others-section">
      <h2 id="sis-h" class="others-h2">{{ t('others.sisters') }}</h2>
      <!-- DS card kit; distinction (red flag and rule) on the first two (HANDOFF §4.5).
           EpflCard is an <article> without a link, so each one sits in an <a>. -->
      <EpflCardDeck>
        <a v-for="(c, i) in cards" :key="c.url" :href="c.url" class="card-link">
          <EpflCard :category="c.kind" :title="c.title" :distinction="i < 2">
            {{ c.text }}
            <strong class="card-host">{{ c.host }}</strong>
          </EpflCard>
        </a>
      </EpflCardDeck>
    </section>

    <section aria-labelledby="ds-h" class="others-section">
      <h2 id="ds-h" class="others-h2">{{ t('others.datasets') }}</h2>
      <div class="datasets">
        <div v-for="g in groups" :key="g.title">
          <h3 class="section-label datasets-title">{{ g.title }}</h3>
          <a v-for="l in g.links" :key="l.url" :href="l.url" class="dataset">
            <span class="dataset-title">{{ l.title }}</span>
            <span class="dataset-host">{{ l.host }}</span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { matOpenInNew } from '@quasar/extras/material-icons'
import { EpflCard, EpflCardDeck } from 'epfl-design-system/kits/vue'

const { t, tm, rt } = useI18n()
const EESD_DATA = 'https://www.epfl.ch/labs/eesd/data_sets/'

// Copied from the EESD data sets page on 2026-10-02 (HANDOFF §4.5); edit in en.json.
type Message = Parameters<typeof rt>[0]
type Link = { title: string; host: string; url: string }
const read = <T extends object>(o: object) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, rt(v as Message)])) as T
const cards = (tm('others.cards') as object[]).map((c) =>
  read<Link & { kind: string; text: string }>(c)
)
const groups = (tm('others.groups') as { title: Message; links: object[] }[]).map((g) => ({
  title: rt(g.title),
  links: g.links.map((l) => read<Link>(l))
}))
</script>

<style scoped lang="scss">
.others {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding-top: 4rem;
  padding-bottom: var(--space-6);
}

.others-intro {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: var(--space-5);
  align-items: end;
}

.others-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.others-title {
  margin: 0;
}

.others-lead {
  margin: 0;
  font-size: var(--fs-lead);
  font-weight: var(--w-light);
  line-height: 1.5;
}

.others-all {
  display: flex;
  justify-content: flex-end;
}

.others-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.others-h2 {
  margin: 0;
  font-size: var(--fs-h3);
  font-weight: var(--w-bold);
  line-height: 1.35;
}

.card-link {
  display: flex;
  color: inherit;
  text-decoration: none;

  > .epfl-card {
    flex: 1;
  }
}

.card-host {
  display: block;
  margin-top: var(--space-3);
  font-size: var(--fs-sm);
}

.datasets {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.datasets-title {
  margin: 0 0 var(--space-1);
  padding-bottom: 0.625rem;
  border-bottom: var(--border-w) solid var(--fg);
}

.dataset {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 10rem;
  gap: var(--space-4);
  align-items: baseline;
  padding: 0.875rem 0;
  color: var(--fg);
  text-decoration: none;
  border-bottom: var(--border-w) solid var(--border-subtle);

  &:hover .dataset-title {
    color: var(--primary);
  }
}

.dataset-title {
  font-size: 0.9375rem;
}

.dataset-host {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}

@media (width <= 64rem) {
  .others-intro,
  .datasets,
  .epfl-card-deck {
    grid-template-columns: minmax(0, 1fr);
  }

  .others-all {
    justify-content: flex-start;
  }
}
</style>
