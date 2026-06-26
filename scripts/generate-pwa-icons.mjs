import { mkdir, writeFile, copyFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const assets = join(root, "public/prepa-icon-assets")
const pngDir = join(assets, "png")
const source = join(assets, "prepa-icon.svg")
const iconsDir = join(root, "public/icons")

await mkdir(iconsDir, { recursive: true })

// The Prepa brand assets are pre-rendered; copy the sizes the app references.
const copies = [
  { from: join(pngDir, "prepa-192.png"), to: join(iconsDir, "icon-192.png") },
  { from: join(pngDir, "prepa-512.png"), to: join(iconsDir, "icon-512.png") },
  { from: join(pngDir, "prepa-180.png"), to: join(iconsDir, "apple-touch-icon.png") },
  // Root-level icons kept for backwards compatibility with older references.
  { from: join(pngDir, "prepa-192.png"), to: join(root, "public/icon-192.png") },
  { from: join(pngDir, "prepa-512.png"), to: join(root, "public/icon-512.png") },
  { from: join(pngDir, "prepa-180.png"), to: join(root, "public/apple-icon.png") },
  { from: join(assets, "favicon.ico"), to: join(root, "app/favicon.ico") },
]

for (const { from, to } of copies) {
  await copyFile(from, to)
}

// Maskable icon: the source SVG has rounded corners, so flatten onto the
// brand background to fill the full square required by maskable purpose.
await writeFile(
  join(iconsDir, "icon-maskable-512.png"),
  await sharp(source, { density: 512 })
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: "#0e1116" })
    .png()
    .toBuffer(),
)

// Replace the default Next.js mark with the Prepa vector icon.
await copyFile(source, join(root, "public/icon.svg"))

console.log("Generated PWA icons from Prepa assets in public/icons/")
