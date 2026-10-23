import { useI18n } from 'vue-i18n'
import { fields } from '../api/dataset.ts'

// Names the app shows for a dataset field: filter, donut and flow-axis keys, plot symbols.
const FIELD: Record<string, string> = {
  unit_type: 'Unit type',
  bed: 'Bed Joints',
  head: 'Head Joints',
  fm_group: 'Failure mode',
  h: 'H',
  bin_H: 'H',
  h0h: 'H0/H',
  bin_H0_H: 'H0/H',
  s0: 'σ0',
  bin_sigma0: 'σ0',
  bin_fm: 'fm,c',
  bin_drift_u: 'δu',
  δpeak: 'δVmax'
}
// Quantities derived in lib/derive.ts: no field holds their definition.
const DERIVED: Record<string, string> = {
  'Vmax/(L·t)': 'tauMax',
  Keff: 'keff',
  bin_H_L: 'aspect'
}

/** A name's glossary definition, for tooltips. A ± pair ('δu') reads its '+' field for both directions. */
export function useGlossary() {
  const { t } = useI18n()
  return (name: string): string | undefined => {
    if (DERIVED[name]) return t(`glossary.${DERIVED[name]}`)
    const n = FIELD[name] ?? name
    const plus = n.replace(/( \[VII\])?$/, '+$1') // 'Vbil [VII]' → 'Vbil+ [VII]'
    return (
      fields.find((f) => f.key === n)?.definition ??
      fields
        .find((f) => f.key === plus)
        ?.definition.replaceAll('positive', t('docs.bothDirections'))
    )
  }
}
