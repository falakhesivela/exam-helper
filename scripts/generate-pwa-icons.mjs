import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const source = join(root, "public/certforge-icon.svg")
const iconsDir = join(root, "public/icons")

const hammerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0e1116" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/>
  <path d="M17.64 15 22 10.64"/>
  <path d="m20.91 11.7-.71-.71"/>
  <path d="M19 13l-1.5 1.5"/>
  <path d="M15 12l2 2"/>
  <path d="m3 21 3-1 11-11-2-2L2 18l1 3z"/>
  <path d="m12 5 7 7"/>
</svg>`

async function renderIcon(size, { maskable = false } = {}) {
  const padding = maskable ? Math.round(size * 0.1) : 0
  const inner = size - padding * 2
  const radius = Math.round(inner * 0.22)
  const markSize = Math.round(inner * 0.42)

  const background = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: maskable ? "#0e1116" : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer()

  const tile = await sharp({
    create: {
      width: inner,
      height: inner,
      channels: 4,
      background: "#2dd4a8",
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}">
            <rect width="${inner}" height="${inner}" rx="${radius}" fill="#2dd4a8"/>
          </svg>`,
        ),
        top: 0,
        left: 0,
      },
      {
        input: await sharp(Buffer.from(hammerSvg))
          .resize(markSize, markSize, { fit: "contain" })
          .png()
          .toBuffer(),
        top: Math.round((inner - markSize) / 2),
        left: Math.round((inner - markSize) / 2),
      },
    ])
    .png()
    .toBuffer()

  return sharp(background)
    .composite([{ input: tile, top: padding, left: padding }])
    .png()
    .toBuffer()
}

await mkdir(iconsDir, { recursive: true })

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
]

for (const { name, size, maskable } of sizes) {
  const buffer = await renderIcon(size, { maskable })
  await writeFile(join(iconsDir, name), buffer)
}

// Keep root-level icons referenced by the manifest for backwards compatibility.
await writeFile(join(root, "public/icon-192.png"), await renderIcon(192))
await writeFile(join(root, "public/icon-512.png"), await renderIcon(512))

// Replace the default Next.js mark with the CertForge icon.
await writeFile(join(root, "public/icon.svg"), await sharp(join(source)).toBuffer())

console.log("Generated PWA icons in public/icons/")
