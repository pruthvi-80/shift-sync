import { writeFile } from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#164e63"/>
      <stop offset="1" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="calendar" x1="112" y1="128" x2="400" y2="408" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ecfeff"/>
    </linearGradient>
    <linearGradient id="petal" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#fde047"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#042f2e" flood-opacity=".38"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#background)"/>
  <circle cx="86" cy="94" r="92" fill="#67e8f9" opacity=".12"/>
  <circle cx="444" cy="440" r="140" fill="#a7f3d0" opacity=".12"/>
  <g filter="url(#shadow)">
    <rect x="92" y="102" width="328" height="304" rx="48" fill="url(#calendar)"/>
    <path d="M92 150c0-26.51 21.49-48 48-48h232c26.51 0 48 21.49 48 48v62H92z" fill="#f59e0b"/>
    <path d="M92 212h328" stroke="#fbbf24" stroke-width="6"/>
    <path d="M158 256h196M158 310h196M158 364h126" stroke="#cbd5e1" stroke-linecap="round" stroke-width="16"/>
    <path d="M170 102v70M342 102v70" stroke="#ffffff" stroke-linecap="round" stroke-width="20"/>
    <circle cx="190" cy="256" r="12" fill="#22c55e"/>
    <circle cx="244" cy="256" r="12" fill="#38bdf8"/>
    <circle cx="298" cy="256" r="12" fill="#f472b6"/>
    <circle cx="190" cy="310" r="12" fill="#a78bfa"/>
    <circle cx="244" cy="310" r="12" fill="#fb923c"/>
  </g>
  <g transform="translate(368 370)">
    <g fill="url(#petal)">
      <ellipse cx="0" cy="-49" rx="19" ry="38"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(45)"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(90)"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(135)"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(180)"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(225)"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(270)"/>
      <ellipse cx="0" cy="-49" rx="19" ry="38" transform="rotate(315)"/>
    </g>
    <circle r="34" fill="#78350f"/>
    <circle r="20" fill="#92400e"/>
  </g>
</svg>`

async function generatePngIcon(size, filename) {
  await sharp(Buffer.from(iconSvg)).resize(size, size).png().toFile(path.join(publicDir, filename))
  console.log(`Generated ${filename} (${size}x${size})`)
}

async function main() {
  console.log('Generating calendar-sunflower icons...\n')

  await Promise.all([
    generatePngIcon(192, 'pwa-192x192.png'),
    generatePngIcon(512, 'pwa-512x512.png'),
    generatePngIcon(180, 'apple-touch-icon.png'),
    writeFile(path.join(publicDir, 'favicon.svg'), iconSvg),
    writeFile(path.join(publicDir, 'pwa-192x192.svg'), iconSvg),
    writeFile(path.join(publicDir, 'pwa-512x512.svg'), iconSvg),
    writeFile(path.join(publicDir, 'apple-touch-icon.svg'), iconSvg),
  ])

  console.log('\nDone! Icons saved to public/')
}

main().catch(console.error)
