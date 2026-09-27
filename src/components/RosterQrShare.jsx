import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { format } from 'date-fns'

function RosterQrShare({ selectedMonth }) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [copyStatus, setCopyStatus] = useState('')

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('month', format(selectedMonth, 'yyyy-MM'))
    return url.toString()
  }, [selectedMonth])

  useEffect(() => {
    if (!isOpen) return

    QRCode.toDataURL(shareUrl, {
      width: 720,
      margin: 2,
      color: { dark: '#172033', light: '#ffffff' },
    }).then(setQrImage).catch(() => setQrImage(''))
  }, [isOpen, shareUrl])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyStatus('Link copied')
    } catch {
      setCopyStatus('Could not copy link')
    }
  }

  const downloadQr = () => {
    if (!qrImage) return

    const link = document.createElement('a')
    link.href = qrImage
    link.download = `snehaa-roster-${format(selectedMonth, 'yyyy-MM')}-qr.png`
    link.click()
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20">
        <span aria-hidden="true">▣</span>
        <span>Share Month by QR</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Share roster QR code">
          <button onClick={() => setIsOpen(false)} className="fixed right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-zinc-950/90 text-zinc-200 shadow-lg" aria-label="Close QR sharing">X</button>
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5 text-center shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">Share roster</p>
            <h2 className="mt-2 font-display text-xl font-bold text-white">{format(selectedMonth, 'MMMM yyyy')}</h2>
            <p className="mt-2 text-sm text-zinc-400">Scan to open this month directly.</p>

            <div className="mx-auto mt-5 flex aspect-square w-full max-w-[240px] items-center justify-center rounded-xl bg-white p-3">
              {qrImage ? <img src={qrImage} alt={`QR code for ${format(selectedMonth, 'MMMM yyyy')} roster`} className="h-full w-full" /> : <span className="text-sm text-slate-500">Generating QR code...</span>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={copyLink} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Copy Link</button>
              <button onClick={downloadQr} disabled={!qrImage} className="rounded-lg bg-cyan-400 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50">Download QR</button>
            </div>
            {copyStatus && <p className="mt-3 text-xs text-cyan-200">{copyStatus}</p>}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default RosterQrShare