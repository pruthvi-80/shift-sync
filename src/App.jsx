import { useState, useEffect, useCallback, useMemo } from 'react'
import DailyView from './components/DailyView'
import MonthlyOverview from './components/MonthlyOverview'
import Header from './components/Header'
import InstallPrompt from './components/InstallPrompt'
import { fetchRoasterForMonth, fetchTodayShift } from './utils/storage'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { getIndianDate, isIndianToday, getIndianMonth, getSplashGreeting } from './utils/indianTime'

function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [view, setView] = useState('daily') // 'daily', 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(getIndianMonth())
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [roasterData, setRoasterData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userNames] = useState({ userA: 'Snehaa 🌻' })
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [todayShift, setTodayShift] = useState(null)

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
  const dayData = roasterData && currentDayKey ? roasterData[currentDayKey] : null

  return (
    <div className="h-full w-full flex flex-col bg-[#09090b]">
      {/* Intro Splash Screen */}
      {showIntro && (
        <div 
          className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center p-8 cursor-pointer animate-fade-in"
          onClick={() => setShowIntro(false)}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-yellow-400/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-orange-400/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Floating emojis */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="absolute text-4xl opacity-20 animate-float" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>🌻</span>
            <span className="absolute text-3xl opacity-15 animate-float" style={{ top: '20%', right: '15%', animationDelay: '0.5s' }}>😼</span>
            <span className="absolute text-2xl opacity-15 animate-float" style={{ bottom: '25%', left: '20%', animationDelay: '1s' }}>🐣</span>
            <span className="absolute text-3xl opacity-15 animate-float" style={{ bottom: '15%', right: '10%', animationDelay: '1.5s' }}>🌻</span>
            <span className="absolute text-2xl opacity-15 animate-float" style={{ top: '40%', left: '5%', animationDelay: '0.7s' }}>🫠</span>
            <span className="absolute text-xl opacity-15 animate-float" style={{ bottom: '40%', right: '5%', animationDelay: '1.2s' }}>😼</span>
            <span className="absolute text-2xl opacity-10 animate-float" style={{ top: '60%', left: '15%', animationDelay: '0.3s' }}>🐣</span>
            <span className="absolute text-xl opacity-10 animate-float" style={{ top: '15%', right: '30%', animationDelay: '0.9s' }}>💛</span>
          </div>
          
          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Large sunflower with glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl animate-pulse" />
              <div className="w-28 h-28 rounded-3xl sunflower-gradient flex items-center justify-center shadow-2xl glow-sunflower animate-bounce-slow">
                <span className="text-6xl drop-shadow-lg">🌻</span>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold font-display text-amber-100 mb-3 animate-slide-up">
              Snehaa's Shift Roster 🌻
            </h1>
            
            {/* Time-based Greeting */}
            <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <p className="text-2xl text-amber-300 font-semibold">{splashGreeting.text}</p>
              <p className="text-amber-400/70 text-sm mt-1">{splashGreeting.subtitle}</p>
            </div>
            
            {/* Emoji row */}
            <div className="flex items-center gap-3 mt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <span className="text-4xl animate-bounce-slow">🐣</span>
            </div>
            
            {/* Tap hint */}
            <p className="text-zinc-600 text-xs mt-12 animate-pulse">
              Tap anywhere to continue
            </p>
          </div>
        </div>
      )}
      
      <Header 
        view={view} 
        setView={setView} 
        hasData={!!roasterData}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        loading={loading}
        todayShift={todayShift}
      />
      
      <main className="flex-1 overflow-y-auto relative">
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
