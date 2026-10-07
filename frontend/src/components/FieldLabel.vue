<template>
  <span>
    <template v-if="parts"
      >{{ parts[0] }}<sub>{{ parts[1] }}</sub
      >{{ parts[2] }}</template
    >
    <template v-else>{{ short ?? field.name }}</template>
    <template v-if="units && field.units !== '[-]'">&nbsp;{{ field.units }}</template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Field } from '../api/types.ts'

const props = defineProps<{
  field: Pick<Field, 'name' | 'units'>
  short?: string
  units?: boolean
}>()

// Symbols set their index as a subscript: fm,c → f + "m,c"; H0/H → H + "0" + "/H".
const parts = computed(() => {
  const { name } = props.field
  if (props.short || name.length < 2 || /\s/.test(name) || name === 'Reference') return null
  return /^(.)([^/]*)(.*)$/.exec(name)!.slice(1)
})
</script>
