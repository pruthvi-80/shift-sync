import { useEffect, useState } from 'react'

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[60] px-3 pt-3 pointer-events-none">
      <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-zinc-950/95 px-3 py-2 text-xs font-medium text-amber-200 shadow-lg">
        <span aria-hidden="true">📴</span>
        <span>Offline mode: showing your saved roster</span>
      </div>
    </div>
  )
}

export default ConnectionStatus