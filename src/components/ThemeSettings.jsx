import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'sunflower', name: 'Sunflower', colors: ['#fbbf24', '#f59e0b', '#18181b'] },
  { id: 'ocean', name: 'Ocean', colors: ['#22d3ee', '#0e7490', '#082f49'] },
  { id: 'rose', name: 'Rose', colors: ['#fb7185', '#be123c', '#4c0519'] },
  { id: 'forest', name: 'Forest', colors: ['#5eead4', '#0f766e', '#06281f'] },
  { id: 'midnight', name: 'Midnight', colors: ['#a5b4fc', '#4f46e5', '#10172a'] },
  { id: 'sakura', name: 'Sakura', colors: ['#f9a8d4', '#db2777', '#2c1021'] },
  { id: 'aurora', name: 'Aurora', colors: ['#a7f3d0', '#38bdf8', '#082f49'] },
  { id: 'lunar', name: 'Lunar', colors: ['#e0e7ff', '#64748b', '#111827'] },
]

const FONT_PAIRS = [
  { id: 'modern', name: 'Modern', preview: 'Clean and bright' },
  { id: 'editorial', name: 'Editorial', preview: 'Elegant and calm' },
  { id: 'soft', name: 'Soft', preview: 'Friendly and warm' },
  { id: 'classic', name: 'Classic', preview: 'Refined and timeless' },
]

function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('shift-sync-theme') || 'sunflower')
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('shift-sync-reduced-motion') === 'true')
  const [font, setFont] = useState(() => localStorage.getItem('shift-sync-font') || 'modern')
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('shift-sync-high-contrast') === 'true')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('shift-sync-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
    localStorage.setItem('shift-sync-reduced-motion', String(reducedMotion))
  }, [reducedMotion])

  useEffect(() => {
    document.documentElement.dataset.font = font
    localStorage.setItem('shift-sync-font', font)
  }, [font])

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast)
    localStorage.setItem('shift-sync-high-contrast', String(highContrast))
  }, [highContrast])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg surface-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
        title="Appearance settings"
        aria-label="Appearance settings"
      >
        <span aria-hidden="true">◐</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-label="Appearance settings">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-zinc-900 p-4 shadow-2xl sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Appearance</h2>
                <p className="mt-1 text-xs text-zinc-400">Saved on this device</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Close appearance settings">X</button>
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Color palette</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(option => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${theme === option.id ? 'border-white/40 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <span className="text-sm font-medium text-zinc-100">{option.name}</span>
                  <span className="flex gap-1" aria-hidden="true">
                    {option.colors.map(color => <span key={color} className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />)}
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-3">
              <span>
                <span className="block text-sm font-medium text-zinc-100">Reduce motion</span>
                <span className="mt-0.5 block text-xs text-zinc-400">Turn off animated effects</span>
              </span>
              <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} className="h-4 w-4 accent-amber-400" />
            </label>

            <div className="mt-3 rounded-lg border border-white/10 p-3">
              <span className="block text-sm font-medium text-zinc-100">Type style</span>
              <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Type style">
                {FONT_PAIRS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setFont(option.id)}
                    className={`rounded-md border px-3 py-2 text-left transition ${font === option.id ? 'border-amber-300 bg-amber-400/15' : 'border-white/10 hover:bg-white/5'}`}
                    aria-label={`${option.name} type style`}
                  >
                    <span className={`block text-sm font-semibold font-preview-${option.id}`}>{option.name}</span>
                    <span className="mt-0.5 block text-[10px] text-zinc-400">{option.preview}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-lg border border-white/10 p-3">
              <span>
                <span className="block text-sm font-medium text-zinc-100">High contrast</span>
                <span className="mt-0.5 block text-xs text-zinc-400">Sharper text and boundaries</span>
              </span>
              <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} className="h-4 w-4 accent-amber-400" />
            </label>
          </div>
        </div>
      )}
    </>
  )
}

export default ThemeSettings