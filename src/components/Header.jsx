import { format, addMonths, subMonths } from 'date-fns'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getGreeting, getIndianDate, getIndianHour } from '../utils/indianTime'
import { fetchWeather } from '../utils/weather'
import { getShiftInfo } from '../utils/shiftCodes'
import { isSupabaseConfigured, supabase } from '../utils/supabase'
import ThemeSettings from './ThemeSettings'

// Get shift-aware subtitle
function getShiftSubtitle(shift) {
  if (!shift) return null
  
  const hour = getIndianHour()
  const info = getShiftInfo(shift)
  const isNight = hour >= 21 || hour < 6
  const timeWord = isNight ? 'Tonight' : 'Today'
  
  // Work shifts
  if (shift === 'N') return { text: `Tonight: Night Shift ${info.emoji}`, icon: '🌙' }
  if (shift === 'M') return { text: `Today: Morning Shift ${info.emoji}`, icon: '🌅' }
  if (shift === 'A') return { text: `Today: Afternoon Shift ${info.emoji}`, icon: '☀️' }
  if (shift === 'US1') return { text: `Today: US Shift ${info.emoji}`, icon: '🇺🇸' }
  if (shift === 'STS') return { text: `Today: General Shift ${info.emoji}`, icon: '💼' }
  
  // Off days
  if (shift === 'WO') return { text: `${timeWord}: Week Off! ${info.emoji}`, icon: '🎉' }
  if (shift === 'H') return { text: `${timeWord}: Holiday! ${info.emoji}`, icon: '🎊' }
  if (shift === 'L') return { text: `${timeWord}: On Leave ${info.emoji}`, icon: '🏖️' }
  if (shift === 'EL') return { text: `${timeWord}: Emergency Leave ${info.emoji}`, icon: '🚨' }
  if (shift === 'CO') return { text: `${timeWord}: Comp Off! ${info.emoji}`, icon: '🎁' }
  if (shift === 'SDO') return { text: `${timeWord}: Special Day Off ${info.emoji}`, icon: '⭐' }
  
  return { text: `${timeWord}: ${info.label}`, icon: info.emoji }
}

function Header({ view, setView, hasData, selectedMonth, onMonthChange, loading, todayShift, isCollapsed, session, authReady, rosterSyncStatus, showAuthPanel, setShowAuthPanel }) {
  const [greeting, setGreeting] = useState(getGreeting())
  const [currentTime, setCurrentTime] = useState(getIndianDate())
  const [weather, setWeather] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authClosing, setAuthClosing] = useState(false)
  const authCloseTimer = useRef(null)
  const shiftSubtitle = getShiftSubtitle(todayShift)

  const closeAuthPanel = () => {
    setAuthClosing(true)
    window.clearTimeout(authCloseTimer.current)
    authCloseTimer.current = window.setTimeout(() => {
      setShowAuthPanel(false)
      setAuthClosing(false)
    }, 180)
  }
  
  // Update time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(getIndianDate())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    if (!showAuthPanel) return undefined
    setAuthClosing(false)
    const handleEscape = event => {
      if (event.key === 'Escape') closeAuthPanel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.clearTimeout(authCloseTimer.current)
    }
  }, [showAuthPanel])

  // Update greeting every minute
  useEffect(() => {
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000)
    return () => clearInterval(greetingInterval)
  }, [])

  // Fetch weather on mount and every 30 minutes
  useEffect(() => {
    fetchWeather().then(setWeather)
    const weatherInterval = setInterval(() => {
      fetchWeather().then(setWeather)
    }, 30 * 60 * 1000)
    return () => clearInterval(weatherInterval)
  }, [])

  const timeString = format(currentTime, 'h:mm a')
  const monthYearString = format(selectedMonth, 'MMM yyyy')

  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1))
  }

  const handleSignIn = async event => {
    event.preventDefault()
    if (!supabase) return
    setAuthBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setAuthBusy(false)
    if (error) {
      setAuthError(error.message)
      return
    }
    setPassword('')
    closeAuthPanel()
  }

  const handleSignOut = async () => {
    if (!supabase) return
    setAuthBusy(true)
    const { error } = await supabase.auth.signOut()
    setAuthBusy(false)
    setAuthError(error?.message || '')
    if (!error) closeAuthPanel()
  }

  return (
    <header className={`app-header surface-1 border-b border-amber-900/30 ${isCollapsed ? 'app-header-hidden' : ''}`}>
      {/* Main Header Row */}
      <div className="app-header-main px-4 py-3">
        <div className="header-main-row flex items-center justify-between max-w-lg mx-auto">
          {/* Left: Logo + Greeting */}
          <div 
            className="header-brand flex items-center gap-3 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="header-logo w-11 h-11 rounded-xl sunflower-gradient flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌻</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-amber-100 font-display leading-tight">
                {greeting.text}
              </h1>
              <p className="text-xs text-amber-400/60 mt-0.5">
                {timeString}
              </p>
            </div>
          </div>
          
          {/* Right: Month Nav + View Toggle */}
          <div className="header-controls flex items-center gap-2">
            <ThemeSettings />

            {/* Month Navigation */}
            {view !== 'cycle' && <div className="header-month-nav flex items-center rounded-lg surface-2 border border-amber-900/20">
              <button
                onClick={handlePrevMonth}
                disabled={loading}
                className="p-1.5 text-zinc-400 hover:text-amber-300 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="px-2 text-xs font-semibold text-amber-200 whitespace-nowrap">
                {monthYearString}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={loading}
                className="p-1.5 text-zinc-400 hover:text-amber-300 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>}

            {/* View Toggle */}
            {hasData && view !== 'cycle' && (
              <nav className="header-view-toggle flex items-center gap-0.5 p-0.5 rounded-lg surface-2 border border-amber-900/20">
                {['daily', 'monthly'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`p-1.5 rounded-md text-sm transition-all ${
                      view === v
                        ? 'sunflower-gradient text-white shadow-md'
                        : 'text-zinc-400 hover:text-amber-300'
                    }`}
                  >
                    {v === 'daily' ? '📅' : '📊'}
                  </button>
                ))}
              </nav>
            )}
            <button
              type="button"
              className="roster-auth-trigger"
              onClick={() => {
                setAuthError('')
                setAuthClosing(false)
                setShowAuthPanel(true)
              }}
              disabled={!authReady}
              aria-label={session ? 'Shared account settings' : 'Log in to Shift Sync'}
              title={session ? 'Shared account' : 'Log in to sync your data'}
            >
              <span aria-hidden="true">{session ? '🌻' : '↪'}</span>
              <span>{session ? 'Snehaa' : 'Log in'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Info Strip - Shift + Weather (always visible) */}
      <div 
        className="app-header-info px-4 py-2 bg-amber-950/20 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="header-info-content flex items-center justify-center gap-4 max-w-lg mx-auto text-xs">
          {/* Shift Info */}
          {shiftSubtitle && (
            <span className="flex items-center gap-1.5 text-amber-300">
              <span>{shiftSubtitle.icon}</span>
              <span className="header-shift-text font-medium">{shiftSubtitle.text}</span>
            </span>
          )}
          
          {/* Weather - Compact */}
          {weather && (
            <>
              {shiftSubtitle && <span className="text-amber-700">•</span>}
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-base">{weather.icon}</span>
                <span className="font-medium">{weather.temp}°C</span>
              </span>
            </>
          )}
          
          {/* Expand indicator */}
          <svg 
            className={`w-3.5 h-3.5 text-amber-600 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expanded Weather Detail */}
      {expanded && weather && (
        <div className="px-4 py-3 bg-amber-950/30 border-t border-amber-900/20">
          <div className="flex flex-col items-center gap-2 max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{weather.icon}</span>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-200">{weather.temp}°C</p>
                <p className="text-xs text-zinc-400 capitalize">{weather.desc}</p>
              </div>
            </div>
            <p className="text-amber-400/50 text-[11px] flex items-center gap-1">
              <span>📍</span>
              <span>{weather.location}</span>
            </p>
          </div>
        </div>
      )}

      {showAuthPanel && createPortal(
        <div className={`roster-auth-backdrop${authClosing ? ' is-closing' : ''}`} onMouseDown={event => {
          if (event.target === event.currentTarget) closeAuthPanel()
        }}>
          <section className={`roster-auth-panel${authClosing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="roster-auth-title">
            <button className="roster-auth-close" type="button" onClick={closeAuthPanel} aria-label="Close login panel">×</button>
            <div className="roster-auth-mark" aria-hidden="true">🌻</div>
            <p className="roster-auth-eyebrow">SHIFT SYNC</p>
            {session ? (
              <>
                <h2 id="roster-auth-title">Snehaa 🌻</h2>
                <p className="roster-auth-copy">This shared account syncs cycle logs, roster moods, and day notes across devices.</p>
                <p className="roster-auth-status" role="status">{rosterSyncStatus || 'Cloud account is connected.'}</p>
                <button className={`roster-auth-submit${authBusy ? ' is-busy' : ''}`} type="button" onClick={handleSignOut} disabled={authBusy}>
                  <span className="roster-auth-button-icon" aria-hidden="true">{authBusy ? '◌' : '↗'}</span>
                  {authBusy ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <h2 id="roster-auth-title">Welcome back</h2>
                <p className="roster-auth-copy">Sign in to sync your shared roster and cycle tracker.</p>
                {!isSupabaseConfigured ? (
                  <p className="roster-auth-error" role="alert">Cloud sign-in is not configured on this deployment.</p>
                ) : (
                  <form className="roster-auth-form" onSubmit={handleSignIn}>
                    <label>
                      <span>Email</span>
                      <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
                    </label>
                    <label>
                      <span>Password</span>
                      <input type="password" autoComplete="current-password" minLength="6" required value={password} onChange={event => setPassword(event.target.value)} />
                    </label>
                    {authError && <p className="roster-auth-error" role="alert">{authError}</p>}
                    <button className={`roster-auth-submit${authBusy ? ' is-busy' : ''}`} type="submit" disabled={authBusy}>
                      {authBusy && <span className="roster-auth-button-icon" aria-hidden="true">◌</span>}
                      {authBusy ? 'Signing in…' : 'Sign in'}
                    </button>
                  </form>
                )}
                <p className="roster-auth-footnote">One shared account for both of you.</p>
              </>
            )}
          </section>
        </div>,
        document.body
      )}
    </header>
  )
}

export default Header
