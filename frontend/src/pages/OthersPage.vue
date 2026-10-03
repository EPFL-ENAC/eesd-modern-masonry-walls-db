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
      <div class="sisters">
        <!-- The DS distinction-card pattern in own markup (red flag, red top rule on the first two, HANDOFF §4.5): the DS card markup could not be checked here. -->
        <a
          v-for="s in others.sisters"
          :key="s.url"
          :href="s.url"
          class="sister"
          :class="{ flagged: s.flag }"
        >
          <span v-if="s.flag" class="sister-flag" aria-hidden="true" />
          <span class="sister-kind">{{ s.kind }}</span>
          <span class="sister-title">{{ s.title }}</span>
          <span class="sister-text">{{ s.text }}</span>
          <span class="sister-host">{{ s.host }}</span>
        </a>
      </div>
    </section>

    <section aria-labelledby="ds-h" class="others-section">
      <h2 id="ds-h" class="others-h2">{{ t('others.datasets') }}</h2>
      <div class="datasets">
        <div v-for="g in others.datasets" :key="g.title">
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
import others from '../assets/others.json'

const { t } = useI18n()
const EESD_DATA = 'https://www.epfl.ch/labs/eesd/data_sets/'
</script>

<style scoped lang="scss">
.others {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding-top: 4rem;
  padding-bottom: 6rem;
}

.others-intro {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 3rem;
  align-items: end;
}

.others-text {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  gap: 1.5rem;
}

.others-h2 {
  margin: 0;
  font-size: var(--fs-h3);
  font-weight: var(--w-bold);
  line-height: 1.35;
}

.sisters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
}

.sister {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.8rem 1.35rem 1.35rem;
  color: var(--fg);
  text-decoration: none;
  border: var(--border-w) solid var(--border-subtle);

  &.flagged {
    border-top-color: var(--primary);
  }

  &:hover {
    border-color: var(--border-strong);

    .sister-title {
      color: var(--primary);
    }
  }
}

.sister-flag {
  position: absolute;
  top: 0;
  left: 1.35rem;
  width: 1.25rem;
  height: 1.875rem;
  background: var(--primary);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 65%, 0 100%);
}

.sister-kind {
  font-size: var(--fs-sm);
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sister-title {
  font-size: 1.25rem;
  font-weight: var(--w-bold);
  line-height: 1.3;
}

.sister-text {
  font-size: 0.9375rem;
  line-height: 1.5;
}

.sister-host {
  margin-top: auto;
  padding-top: 0.75rem;
  font-size: var(--fs-sm);
  font-weight: var(--w-bold);
}

.datasets {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3rem;
}

.datasets-title {
  margin: 0 0 0.25rem;
  padding-bottom: 0.625rem;
  border-bottom: var(--border-w) solid var(--fg);
}

.dataset {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 10rem;
  gap: 1.5rem;
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
  .sisters,
  .datasets {
    grid-template-columns: minmax(0, 1fr);
  }

  .others-all {
    justify-content: flex-start;
  }
}
</style>
