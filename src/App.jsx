import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import DailyView from './components/DailyView'
import MonthlyOverview from './components/MonthlyOverview'
import Header from './components/Header'
import InstallPrompt from './components/InstallPrompt'
import ConnectionStatus from './components/ConnectionStatus'
import IntroSplash from './components/IntroSplash'
const CycleTracker = lazy(() => import('./components/CycleTracker'))
import { supabase } from './utils/supabase'
import { fetchRoasterForMonth, fetchTodayShift } from './utils/storage'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { getIndianDate, isIndianToday, getIndianMonth, getSplashGreeting } from './utils/indianTime'

const MOODS_STORAGE_KEY = 'shiftSync_moods'
const NOTES_STORAGE_KEY = 'shiftSync_notes'

function loadRosterUserData() {
  try {
    return {
      moods: JSON.parse(localStorage.getItem(MOODS_STORAGE_KEY) || '{}'),
      notes: JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}')
    }
  } catch {
    return { moods: {}, notes: {} }
  }
}

function saveRosterUserData(data) {
  localStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(data.moods))
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data.notes))
}

function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [view, setView] = useState('daily') // 'daily', 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(getIndianMonth())
  const [cycleCalendarMonth, setCycleCalendarMonth] = useState(getIndianMonth())
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [roasterData, setRoasterData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userNames] = useState({ userA: 'Snehaa 🌻' })
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [todayShift, setTodayShift] = useState(null)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [showAuthPanel, setShowAuthPanel] = useState(false)
  const [rosterUserData, setRosterUserData] = useState(loadRosterUserData)
  const [rosterSyncStatus, setRosterSyncStatus] = useState('')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const lastScrollTop = useRef(0)
  const headerCollapsedRef = useRef(false)
  const headerScrollLockUntil = useRef(0)
  const mainScrollRef = useRef(null)
  const rosterUserDataRef = useRef(rosterUserData)
  const rosterSyncQueue = useRef(Promise.resolve())
  const rosterSaveTimer = useRef(null)
  const rosterSyncRevision = useRef(0)
  rosterUserDataRef.current = rosterUserData

  useEffect(() => () => window.clearTimeout(rosterSaveTimer.current), [])

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true)
      return undefined
    }

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data?.session || null)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session || !supabase) return undefined

    let active = true
    const loadSharedRosterData = async () => {
      setRosterSyncStatus('Loading shared roster notes…')
      const { data, error } = await supabase
        .from('shift_sync_user_data')
        .select('moods, notes')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!active) return
      if (error) {
        setRosterSyncStatus(`Could not load roster notes: ${error.message}`)
        return
      }

      const localData = loadRosterUserData()
      let nextData
      if (data) {
        nextData = { moods: data.moods || {}, notes: data.notes || {} }
      } else {
        nextData = localData
        const { error: importError } = await supabase.from('shift_sync_user_data').upsert({
          user_id: session.user.id,
          moods: nextData.moods,
          notes: nextData.notes
        })
        if (!active) return
        if (importError) {
          setRosterSyncStatus(`Could not import this device's roster notes: ${importError.message}`)
          return
        }
      }

      rosterUserDataRef.current = nextData
      setRosterUserData(nextData)
      saveRosterUserData(nextData)
      setRosterSyncStatus(data ? 'Roster notes and moods synced.' : 'Roster notes and moods are ready to sync.')
    }

    let initialLoadStarted = false
    const startInitialLoad = () => {
      if (initialLoadStarted) return
      initialLoadStarted = true
      loadSharedRosterData()
    }
    const channel = supabase
      .channel(`shift-sync-roster-${session.user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shift_sync_user_data',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        if (payload.eventType === 'DELETE') return
        const row = payload.new
        if (!row) return

        const nextData = {
          moods: row.moods || {},
          notes: row.notes || {}
        }
        rosterUserDataRef.current = nextData
        setRosterUserData(nextData)
        saveRosterUserData(nextData)
        setRosterSyncStatus('Roster notes and moods synced.')
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startInitialLoad()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRosterSyncStatus('Live roster sync disconnected. Changes remain saved locally.')
        }
      })

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [session])

  const updateRosterUserData = (field, value) => {
    const nextData = { ...rosterUserDataRef.current, [field]: value }
    rosterUserDataRef.current = nextData
    setRosterUserData(nextData)
    saveRosterUserData(nextData)

    if (!session || !supabase) {
      setRosterSyncStatus('Saved on this device. Sign in from the header to sync.')
      return
    }

    const revision = ++rosterSyncRevision.current
    setRosterSyncStatus('Saved on this device · syncing…')
    window.clearTimeout(rosterSaveTimer.current)
    rosterSaveTimer.current = window.setTimeout(() => {
      const syncTask = rosterSyncQueue.current.then(() => supabase.from('shift_sync_user_data').upsert({
        user_id: session.user.id,
        moods: rosterUserDataRef.current.moods,
        notes: rosterUserDataRef.current.notes,
        updated_at: new Date().toISOString()
      }))
      rosterSyncQueue.current = syncTask.catch(() => undefined)
      syncTask.then(({ error }) => {
        if (revision !== rosterSyncRevision.current) return
        setRosterSyncStatus(error ? `Saved locally; cloud sync failed: ${error.message}` : 'Roster notes and moods synced.')
      })
    }, 400)
  }

  // Fetch today's shift for splash greeting
  useEffect(() => {
    fetchTodayShift().then(shift => setTodayShift(shift))
  }, [])

  // Memoize splash greeting with shift awareness
  const splashGreeting = useMemo(() => getSplashGreeting(todayShift), [todayShift])

  // Get all days of the selected month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  })

  // Load roaster data from JSON files
  useEffect(() => {
    async function loadRoaster() {
      setLoading(true)
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      const data = await fetchRoasterForMonth(year, month)
      setRoasterData(data)
      setLoading(false)
    }
    loadRoaster()
  }, [selectedMonth])

  // Find today's index (using Indian timezone) when data loads
  useEffect(() => {
    if (roasterData && daysInMonth.length > 0) {
      const todayIndex = daysInMonth.findIndex(day => isIndianToday(day))
      if (todayIndex !== -1) {
        setCurrentDayIndex(todayIndex)
      } else {
        // Find nearest date with data
        const indianToday = getIndianDate()
        let nearestIndex = 0
        let minDiff = Infinity
        daysInMonth.forEach((day, index) => {
          const diff = Math.abs(day.getTime() - indianToday.getTime())
          if (diff < minDiff) {
            minDiff = diff
            nearestIndex = index
          }
        })
        setCurrentDayIndex(nearestIndex)
      }
    }
  }, [roasterData, selectedMonth])

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  // Change month handler
  const handleMonthChange = useCallback((newMonth) => {
    setSelectedMonth(newMonth)
    setCurrentDayIndex(0)
  }, [])

  const handleHeaderMonthChange = useCallback((newMonth) => {
    if (view === 'cycle') {
      setCycleCalendarMonth(newMonth)
    } else {
      handleMonthChange(newMonth)
    }
  }, [handleMonthChange, view])

  const handlePrevDay = useCallback(() => {
    setCurrentDayIndex(prev => Math.max(0, prev - 1))
  }, [])

  const handleNextDay = useCallback(() => {
    setCurrentDayIndex(prev => Math.min(daysInMonth.length - 1, prev + 1))
  }, [daysInMonth.length])

  const handleDaySelect = useCallback((index) => {
    setCurrentDayIndex(index)
    setView('daily')
  }, [])

  const revealHeader = useCallback((lockScroll = false) => {
    headerCollapsedRef.current = false
    setHeaderCollapsed(false)
    if (lockScroll) {
      headerScrollLockUntil.current = Date.now() + 500
    }
  }, [])

  const handleRosterReveal = useCallback(() => {
    headerScrollLockUntil.current = Date.now() + 900
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => {
      revealHeader()
      mainScrollRef.current?.scrollTo({ top: 0 })
    }, 260)
  }, [revealHeader])

  const handleMainScroll = useCallback((event) => {
    const scrollTop = event.currentTarget.scrollTop
    const scrollDelta = scrollTop - lastScrollTop.current

    if (Date.now() < headerScrollLockUntil.current) {
      lastScrollTop.current = scrollTop
      return
    }

    const setHeaderVisibility = (collapsed) => {
      if (headerCollapsedRef.current === collapsed) return
      headerCollapsedRef.current = collapsed
      setHeaderCollapsed(collapsed)
      if (collapsed) {
        headerScrollLockUntil.current = Date.now() + 320
      }
    }

    if (scrollTop < 28 || scrollDelta < -12) {
      revealHeader()
    } else if (scrollTop > 72 && scrollDelta > 12) {
      setHeaderVisibility(true)
    }

    lastScrollTop.current = scrollTop
  }, [revealHeader])

  const currentDay = daysInMonth[currentDayIndex]
  const currentDayKey = currentDay ? format(currentDay, 'yyyy-MM-dd') : null
  const dayData = roasterData && currentDayKey ? roasterData[currentDayKey] : null

  return (
    <div className="app-shell h-full w-full flex flex-col bg-[#09090b]">
      <ConnectionStatus />
      {showIntro && <IntroSplash greeting={splashGreeting} shift={todayShift} onEnter={() => setShowIntro(false)} />}
      
      <Header 
        view={view} 
        setView={setView} 
        hasData={!!roasterData}
        selectedMonth={view === 'cycle' ? cycleCalendarMonth : selectedMonth}
        onMonthChange={handleHeaderMonthChange}
        loading={loading}
        todayShift={todayShift}
        isCollapsed={headerCollapsed}
        session={session}
        authReady={authReady}
        rosterSyncStatus={rosterSyncStatus}
        showAuthPanel={showAuthPanel}
        setShowAuthPanel={setShowAuthPanel}
      />

      <nav className={`app-section-tabs${headerCollapsed ? ' has-reveal-pill' : ''}`} aria-label="App sections">
        <button
          type="button"
          className={view !== 'cycle' ? 'app-section-tab active' : 'app-section-tab'}
          aria-current={view !== 'cycle' ? 'page' : undefined}
          onClick={() => setView('daily')}
        >
          <span aria-hidden="true">🌻</span>
          <span>Shift Roster</span>
        </button>
        <button
          type="button"
          className={view === 'cycle' ? 'app-section-tab active' : 'app-section-tab'}
          aria-current={view === 'cycle' ? 'page' : undefined}
          onClick={() => setView('cycle')}
        >
          <span aria-hidden="true">🌸</span>
          <span>Cycle Tracker</span>
        </button>
        {headerCollapsed && (
          <button onClick={handleRosterReveal} className="header-reveal-pill" aria-label="Show roster header">
            <span>🌻</span>
            <span>Roster</span>
          </button>
        )}
      </nav>

      <main ref={mainScrollRef} className="flex-1 overflow-y-auto relative" onScroll={handleMainScroll}>
        {view === 'daily' && (
          loading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center fade-in">
              <div className="w-16 h-16 rounded-2xl sunflower-gradient flex items-center justify-center shadow-lg glow-sunflower animate-pulse">
                <span className="text-3xl">🌻</span>
              </div>
              <p className="text-amber-400/60 mt-4 text-sm">Loading roaster...</p>
            </div>
          ) : roasterData ? (
            <DailyView
              date={currentDay}
              dayData={dayData}
              onPrev={handlePrevDay}
              onNext={handleNextDay}
              hasPrev={currentDayIndex > 0}
              hasNext={currentDayIndex < daysInMonth.length - 1}
              currentIndex={currentDayIndex}
              totalDays={daysInMonth.length}
              userNames={userNames}
              roasterData={roasterData}
              daysInMonth={daysInMonth}
              moodData={rosterUserData.moods}
              notesData={rosterUserData.notes}
              onMoodDataChange={value => updateRosterUserData('moods', value)}
              onNotesDataChange={value => updateRosterUserData('notes', value)}
            />
          ) : (
            <div className="min-h-full flex flex-col items-center p-8 pt-12 text-center fade-in">
              {/* Sunflower glow */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Logo */}
              <div className="relative z-10 mb-6">
                <div className="w-20 h-20 rounded-2xl sunflower-gradient flex items-center justify-center shadow-lg glow-sunflower">
                  <span className="text-4xl">🌻</span>
                </div>
              </div>
              
              <h2 className="relative z-10 text-3xl font-bold mb-2 font-display text-amber-100">
                Snehaa's Shift Roster
              </h2>
              <p className="relative z-10 text-amber-400/60 mb-2 text-sm">
                For Sunflower 💛
              </p>
              <p className="relative z-10 text-zinc-500 mb-8 max-w-xs text-sm leading-relaxed">
                No roster data for this month yet
              </p>
              
              <p className="relative z-10 text-amber-400/40 text-xs max-w-xs">
                🌻 Check back soon! 🐣
              </p>
              
              {/* Feature list */}
              <div className="relative z-10 flex flex-col gap-2 mt-10 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">🌼</span>
                  Track Snehaa's shifts easily
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">💛</span>
                  Beautiful shift themes
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✨</span>
                  Made with care 🌻
                </span>
              </div>
            </div>
          )
        )}
        
        {view === 'monthly' && roasterData && (
          <MonthlyOverview
            selectedMonth={selectedMonth}
            roasterData={roasterData}
            onDaySelect={handleDaySelect}
            currentDayIndex={currentDayIndex}
          />
        )}

        {view === 'cycle' && (
          <Suspense fallback={<div className="cycle-loading" role="status">Opening Cycle Tracker…</div>}>
            <CycleTracker
              session={session}
              authReady={authReady}
              onLogin={() => setShowAuthPanel(true)}
              calendarMonth={cycleCalendarMonth}
            />
          </Suspense>
        )}
      </main>

      {showInstallPrompt && (
        <InstallPrompt 
          onInstall={handleInstall}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}
    </div>
  )
}

export default App
