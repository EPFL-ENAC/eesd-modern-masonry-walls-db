<template>
  <component :is="to ? RouterLink : 'span'" :to="to" :data-tip="tip">
    <template v-if="parts"
      >{{ parts[0] }}<sub>{{ parts[1] }}</sub
      >{{ parts[2] }}</template
    >
    <template v-else>{{ short ?? field.name }}</template>
    <template v-if="units && field.units !== '[-]'">&nbsp;{{ field.units }}</template>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Field } from '../api/types.ts'
import { fieldOf, glossaryRoute, useGlossary } from '../composables/useGlossary.ts'

const props = defineProps<{
  /** A real Field brings its own definition (Pavia and EPFL repeats differ); a name is looked up. */
  field: Pick<Field, 'name' | 'units'> & Partial<Pick<Field, 'key' | 'definition'>>
  short?: string
  units?: boolean
  /** No tooltip: the definition is already beside the label (the glossary). */
  noTip?: boolean
  /** Link to the label's glossary row; only where the label isn't inside a control. */
  link?: boolean
}>()

const glossary = useGlossary()
// The key first (a Field's own), else the name: a Visuals axis's key is its derived column.
const to = computed(() => {
  if (!props.link) return undefined
  const { key, name } = props.field
  const f = (key && fieldOf(key)) || fieldOf(name)
  return f ? glossaryRoute(f.key) : undefined
})
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
