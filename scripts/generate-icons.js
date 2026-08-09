import { Jimp, intToRGBA, rgbaToInt } from 'jimp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

function toInt(r, g, b, a = 255) {
  return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0
}

async function generateIcon(size, filename) {
  // Create a new image with dark background
  const image = new Jimp({ width: size, height: size, color: 0x18181bff })
  
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = size * 0.42
  const innerRadius = size * 0.22
  
  // Draw sunflower petals (amber/yellow)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX
      const dy = y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist <= outerRadius && dist >= innerRadius) {
        // Petal area - amber gradient
        const angle = Math.atan2(dy, dx)
        const petalFactor = Math.abs(Math.sin(angle * 8)) // 8 petals
        if (petalFactor > 0.25) {
          // Amber color #fbbf24
          const brightness = 0.85 + petalFactor * 0.15
          const r = Math.min(255, Math.floor(251 * brightness))
          const g = Math.min(255, Math.floor(191 * brightness))
          const b = Math.min(255, Math.floor(36 * brightness))
          image.setPixelColor(toInt(r, g, b, 255), x, y)
        }
      } else if (dist < innerRadius) {
        // Center - brown/orange #92400e
        const factor = 0.85 + (1 - dist / innerRadius) * 0.15
        const r = Math.floor(146 * factor)
        const g = Math.floor(64 * factor)
        const b = Math.floor(14 * factor)
        image.setPixelColor(toInt(r, g, b, 255), x, y)
      }
    }
  }
  
  const outputPath = path.join(publicDir, filename)
  await image.write(outputPath)
  console.log(`✓ Generated ${filename} (${size}x${size})`)
}

async function main() {
  console.log('🌻 Generating PWA icons...\n')
  
  await generateIcon(192, 'pwa-192x192.png')
  await generateIcon(512, 'pwa-512x512.png')
  await generateIcon(180, 'apple-touch-icon.png')
  
  console.log('\n✨ Done! Icons saved to public/')
}

main().catch(console.error)
