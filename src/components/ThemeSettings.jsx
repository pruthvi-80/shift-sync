import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const THEMES = [
  { id: 'sunflower', name: 'Sunflower', colors: ['#fbbf24', '#f59e0b', '#18181b'] },
  { id: 'ocean', name: 'Ocean', colors: ['#22d3ee', '#0e7490', '#082f49'] },
  { id: 'blossom', name: 'Rose Blossom', colors: ['#f9a8d4', '#e11d48', '#4c0519'] },
  { id: 'forest', name: 'Forest', colors: ['#5eead4', '#0f766e', '#06281f'] },
  { id: 'midnight', name: 'Midnight', colors: ['#a5b4fc', '#4f46e5', '#10172a'] },
  { id: 'aurora', name: 'Aurora', colors: ['#a7f3d0', '#38bdf8', '#082f49'] },
  { id: 'lunar', name: 'Lunar', colors: ['#e0e7ff', '#64748b', '#111827'] },
  { id: 'ember', name: 'Ember', colors: ['#fdba74', '#ea580c', '#431407'] },
  { id: 'orchid', name: 'Orchid', colors: ['#d8b4fe', '#9333ea', '#2e1065'] },
  { id: 'slate', name: 'Slate', colors: ['#cbd5e1', '#475569', '#0f172a'] },
  { id: 'citrus', name: 'Citrus', colors: ['#d9f99d', '#65a30d', '#1a2e05'] },
]

const FONT_PAIRS = [
  { id: 'modern', name: 'Modern', preview: 'Clean and bright' },
  { id: 'editorial', name: 'Editorial', preview: 'Elegant and calm' },
  { id: 'soft', name: 'Soft', preview: 'Friendly and warm' },
  { id: 'classic', name: 'Classic', preview: 'Refined and timeless' },
]

function getSavedTheme() {
  const savedTheme = localStorage.getItem('shift-sync-theme')
  if (savedTheme === 'rose' || savedTheme === 'sakura') return 'blossom'
  return THEMES.some(option => option.id === savedTheme) ? savedTheme : 'sunflower'
}

function getSavedFont() {
  const savedFont = localStorage.getItem('shift-sync-font')
  return FONT_PAIRS.some(option => option.id === savedFont) ? savedFont : 'modern'
}

function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState(getSavedTheme)
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('shift-sync-reduced-motion') === 'true')
  const [font, setFont] = useState(getSavedFont)
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('shift-sync-high-contrast') === 'true')
  const [glassMode, setGlassMode] = useState(() => localStorage.getItem('shift-sync-glass-mode') === 'true')

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

  useEffect(() => {
    document.documentElement.classList.toggle('glass-mode', glassMode)
    localStorage.setItem('shift-sync-glass-mode', String(glassMode))
  }, [glassMode])

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

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-label="Appearance settings">
          <button onClick={() => setIsOpen(false)} className="fixed right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-zinc-950/90 text-zinc-300 shadow-lg backdrop-blur hover:bg-zinc-800 hover:text-white" aria-label="Close appearance settings">X</button>
          <div className="appearance-panel max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-xl border p-4 pt-12 shadow-2xl sm:p-5 sm:pt-12">
            <div className="mb-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Shift Sync</p>
                <h2 className="mt-1 font-display text-xl font-bold text-white">Appearance</h2>
                <p className="mt-1 text-xs text-zinc-300/70">Your choices are saved on this device</p>
              </div>
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Color palette</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(option => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${theme === option.id ? 'appearance-choice-selected' : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.08]'}`}
                >
                  <span className="text-sm font-medium text-zinc-100">{option.name}</span>
                  <span className="flex gap-1" aria-hidden="true">
                    {option.colors.map(color => <span key={color} className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />)}
                  </span>
                </button>
              ))}
            </div>

            <label className="appearance-glass-toggle mt-3 flex cursor-pointer items-center justify-between rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium text-zinc-100">Glass mode</span>
                <span className="mt-0.5 block text-xs text-zinc-400">Translucent surfaces with a soft color backdrop</span>
              </span>
              <input type="checkbox" checked={glassMode} onChange={(event) => setGlassMode(event.target.checked)} className="h-4 w-4 accent-cyan-300" />
            </label>

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
                    className={`rounded-md border px-3 py-2 text-left transition ${font === option.id ? 'appearance-choice-selected' : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.08]'}`}
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
      , document.body)}
    </>
  )
}

export default ThemeSettings