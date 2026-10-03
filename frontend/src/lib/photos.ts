/**
 * Web versions of the specimen photos, as in sxl-recrete-atlas: `<name>-512.webp`
 * and `<name>-1920.webp` beside each original, which stays for download.
 * Written by `pnpm optimize-images`, checked by `pnpm convert`.
 */
export const PHOTO_FOLDERS = [
  '05_fig_setup',
  '06_fig_failmode',
  '07_fig_materials',
  '08_fig_cracks'
]
export const PHOTO_WIDTHS = [512, 1920] as const
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number]

const ORIGINAL = /\.(jpe?g|png)$/i

/** fig_setup_0189.jpg → fig_setup_0189-512.webp */
export const variant = (path: string, width: PhotoWidth) => path.replace(/\.\w+$/, `-${width}.webp`)

export const isVariant = (path: string) => /-\d+\.webp$/.test(path)

/** The web versions missing from a listing of dataset paths. */
export function missingVariants(paths: readonly string[]): string[] {
  const have = new Set(paths)
  return paths
    .filter((p) => ORIGINAL.test(p))
    .flatMap((p) => PHOTO_WIDTHS.map((w) => variant(p, w)))
    .filter((v) => !have.has(v))
}
