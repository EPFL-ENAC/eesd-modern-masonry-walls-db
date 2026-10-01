<script setup lang="ts">
import BackendInfo from '@/components/BackendInfo.vue'
</script>

<template>
  <v-container>
    <h1 class="text-h4 mb-2">{{ $t('app.title') }}</h1>
    <p class="mb-6">{{ $t('home.intro') }}</p>
    <backend-info />
  </v-container>
</template>
