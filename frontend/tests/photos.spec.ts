import { describe, expect, it } from 'vitest'
import { isVariant, missingVariants, variant } from '../src/lib/photos.ts'

describe('photo web versions', () => {
  it('sit beside the original', () => {
    expect(variant('05_fig_setup/fig_setup_0189.jpg', 512)).toBe(
      '05_fig_setup/fig_setup_0189-512.webp'
    )
    expect(isVariant('fig_setup_0189-1920.webp')).toBe(true)
    expect(isVariant('fig_setup_0189.jpg')).toBe(false)
  })

  it('are all required', () => {
    const files = ['05_fig_setup/fig_setup_0189.jpg', '05_fig_setup/fig_setup_0189-512.webp']
    expect(missingVariants(files)).toEqual(['05_fig_setup/fig_setup_0189-1920.webp'])
  })
})
