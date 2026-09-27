import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'sunflower', name: 'Sunflower', colors: ['#fbbf24', '#f59e0b', '#18181b'] },
  { id: 'ocean', name: 'Ocean', colors: ['#22d3ee', '#0e7490', '#082f49'] },
  { id: 'rose', name: 'Rose', colors: ['#fb7185', '#be123c', '#4c0519'] },
]

function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('shift-sync-theme') || 'sunflower')
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('shift-sync-reduced-motion') === 'true')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('shift-sync-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
    localStorage.setItem('shift-sync-reduced-motion', String(reducedMotion))
  }, [reducedMotion])

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
        <div className="fixed inset-0 z-[70] flex items-end bg-black/60 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Appearance settings">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Appearance</h2>
                <p className="mt-1 text-xs text-zinc-400">Saved on this device</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Close appearance settings">x</button>
            </div>

            <div className="space-y-2">
              {THEMES.map(option => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${theme === option.id ? 'border-white/40 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
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
          </div>
        </div>
      )}
    </>
  )
}

export default ThemeSettings