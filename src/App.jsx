import { useState, useEffect, useCallback } from 'react'
import DailyView from './components/DailyView'
import MonthlyOverview from './components/MonthlyOverview'
import Header from './components/Header'
import InstallPrompt from './components/InstallPrompt'
import { fetchRosterForMonth } from './utils/storage'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { getIndianDate, isIndianToday, getIndianMonth } from './utils/indianTime'

function App() {
  const [view, setView] = useState('daily') // 'daily', 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(getIndianMonth())
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [rosterData, setRosterData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userNames] = useState({ userA: 'Snehaa 🌻', userB: 'Partner' })
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // Get all days of the selected month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  })

  // Load roster data from JSON files
  useEffect(() => {
    async function loadRoster() {
      setLoading(true)
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      const data = await fetchRosterForMonth(year, month)
      setRosterData(data)
      setLoading(false)
    }
    loadRoster()
  }, [selectedMonth])

  // Find today's index (using Indian timezone) when data loads
  useEffect(() => {
    if (rosterData && daysInMonth.length > 0) {
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
  }, [rosterData, selectedMonth])

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

  const currentDay = daysInMonth[currentDayIndex]
  const currentDayKey = currentDay ? format(currentDay, 'yyyy-MM-dd') : null
  const dayData = rosterData && currentDayKey ? rosterData[currentDayKey] : null

  return (
    <div className="h-full w-full flex flex-col bg-[#09090b]">
      <Header 
        view={view} 
        setView={setView} 
        hasData={!!rosterData}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        loading={loading}
      />
      
      <main className="flex-1 overflow-y-auto relative">
        {view === 'daily' && (
          loading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center fade-in">
              <div className="w-16 h-16 rounded-2xl sunflower-gradient flex items-center justify-center shadow-lg glow-sunflower animate-pulse">
                <span className="text-3xl">🌻</span>
              </div>
              <p className="text-amber-400/60 mt-4 text-sm">Loading roster...</p>
            </div>
          ) : rosterData ? (
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
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center fade-in">
              {/* Sunflower glow */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
              
              {/* Logo */}
              <div className="relative z-10 mb-6">
                <div className="w-20 h-20 rounded-2xl sunflower-gradient flex items-center justify-center shadow-lg glow-sunflower">
                  <span className="text-4xl">🌻</span>
                </div>
              </div>
              
              <h2 className="relative z-10 text-3xl font-bold mb-2 font-display text-amber-100">
                Sunflower Sync
              </h2>
              <p className="relative z-10 text-amber-400/60 mb-2 text-sm">
                For my beautiful sunflower 💛
              </p>
              <p className="relative z-10 text-zinc-500 mb-8 max-w-xs text-sm leading-relaxed">
                No roster data for this month yet
              </p>
              
              <p className="relative z-10 text-zinc-600 text-xs max-w-xs">
                Roster files are located in:<br/>
                <code className="text-amber-500/60">rosters/2026/aug.json</code>
              </p>
              
              {/* Feature list */}
              <div className="relative z-10 flex flex-col gap-2 mt-10 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">🌼</span>
                  Find matching shifts together
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">💛</span>
                  Celebrate days together
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✨</span>
                  Made with love for Snehaa
                </span>
              </div>
            </div>
          )
        )}
        
        {view === 'monthly' && rosterData && (
          <MonthlyOverview
            selectedMonth={selectedMonth}
            rosterData={rosterData}
            onDaySelect={handleDaySelect}
            currentDayIndex={currentDayIndex}
          />
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
