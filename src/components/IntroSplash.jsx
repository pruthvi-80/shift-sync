import { getShiftInfo } from '../utils/shiftCodes'

function IntroSplash({ greeting, shift, onEnter }) {
  const shiftInfo = shift ? getShiftInfo(shift) : null

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEnter()
    }
  }

  return (
    <div
      className="intro-splash"
      role="button"
      tabIndex={0}
      aria-label="Enter Snehaa's Shift Roster"
      onClick={onEnter}
      onKeyDown={handleKeyDown}
    >
      <div className="intro-splash-grid" aria-hidden="true" />
      <div className="intro-splash-halo intro-splash-halo-one" aria-hidden="true" />
      <div className="intro-splash-halo intro-splash-halo-two" aria-hidden="true" />

      <header className="intro-splash-header">
        <span className="intro-splash-brand">SNEHAA'S ROSTER</span>
        <span className="intro-splash-date">TODAY</span>
      </header>

      <main className="intro-splash-content">
        <div className="intro-splash-icon-wrap" aria-hidden="true">
          <img src="/pwa-192x192.png" alt="" className="intro-splash-icon" />
        </div>

        <p className="intro-splash-eyebrow">YOUR SHIFT COMPANION</p>
        <h1 className="intro-splash-title">Ready for today?</h1>
        <p className="intro-splash-greeting">{greeting.text}</p>
        <p className="intro-splash-subtitle">{greeting.subtitle}</p>

        {shiftInfo && (
          <div className="intro-splash-shift">
            <span className="intro-splash-shift-emoji">{shiftInfo.emoji}</span>
            <span>
              <span className="intro-splash-shift-label">Today's shift</span>
              <span className="intro-splash-shift-name">{shiftInfo.label}{shiftInfo.timing ? ` · ${shiftInfo.timing}` : ''}</span>
            </span>
          </div>
        )}
      </main>

      <footer className="intro-splash-footer">
        <span className="intro-splash-enter">Tap anywhere to enter</span>
        <span className="intro-splash-dot" aria-hidden="true" />
      </footer>
    </div>
  )
}

export default IntroSplash