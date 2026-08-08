function InstallPrompt({ onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 fade-in">
      <div className="max-w-md mx-auto p-4 rounded-xl surface-1 border border-zinc-800 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg accent-gradient flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-zinc-100 text-sm">Install App</h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Add to home screen for quick access
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 py-2 rounded-lg surface-2 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all"
          >
            Later
          </button>
          <button
            onClick={onInstall}
            className="flex-1 py-2 rounded-lg accent-gradient text-white text-xs font-medium transition-all hover:opacity-90"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt
