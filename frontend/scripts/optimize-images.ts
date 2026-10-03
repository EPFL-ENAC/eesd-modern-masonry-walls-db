/**
 * public/data/05…08 photos → web versions (`pnpm optimize-images`), as in
 * sxl-recrete-atlas: 512 and 1920 px wide WebP beside each original. Up-to-date
 * outputs are skipped. Commit the results (git-lfs, like the originals).
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { PHOTO_FOLDERS, PHOTO_WIDTHS, isVariant, variant } from '../src/lib/photos.ts'

const QUALITY = 85
const root = new URL('../public/data', import.meta.url).pathname

for (const folder of PHOTO_FOLDERS) {
  for (const name of readdirSync(join(root, folder))) {
    if (name.startsWith('.') || isVariant(name)) continue
    const src = join(root, folder, name)
    for (const width of PHOTO_WIDTHS) {
      const out = join(root, folder, variant(name, width))
      if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue
      // rotate(): apply the EXIF orientation, which WebP output would drop.
      await sharp(src)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out)
      console.log(`${folder}/${variant(name, width)}`)
    }
  }
}
