<template>
  <span :data-tip="tip">
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
import { useGlossary } from '../composables/useGlossary.ts'

const props = defineProps<{
  /** A real Field brings its own definition (Pavia and EPFL repeats differ); a name is looked up. */
  field: Pick<Field, 'name' | 'units'> & Partial<Pick<Field, 'definition'>>
  short?: string
  units?: boolean
  /** No tooltip: the definition is already beside the label (the glossary). */
  noTip?: boolean
}>()

const glossary = useGlossary()
const tip = computed(() =>
  props.noTip ? undefined : (props.field.definition ?? glossary(props.field.name))
)

// Symbols set their index as a subscript: fm,c → f + "m,c"; H0/H → H + "0" + "/H".
// Words and the ALR acronym are not symbols.
const PLAIN = new Set(['Reference', 'Institution', 'Year', 'ALR'])
const parts = computed(() => {
  const { name } = props.field
  if (props.short || name.length < 2 || /\s/.test(name) || PLAIN.has(name)) return null
  return /^(.)([^/]*)(.*)$/.exec(name)!.slice(1)
})
</script>
