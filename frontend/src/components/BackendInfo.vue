<script setup lang="ts">
import { getInfo, type Info } from '@/api/info'
import { onMounted, ref } from 'vue'

const info = ref<Info>()
const error = ref<string>()

onMounted(async () => {
  try {
    info.value = await getInfo()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})
</script>

<template>
  <v-alert v-if="error" type="error" variant="tonal">
    {{ $t('backend.error', { error }) }}
  </v-alert>
  <p v-else-if="info" class="text-medium-emphasis">
    {{ $t('backend.version', { name: info.name, version: info.version }) }}
  </p>
  <v-progress-circular v-else indeterminate size="20" :aria-label="$t('backend.loading')" />
</template>
