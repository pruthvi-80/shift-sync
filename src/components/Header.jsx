import { format, addMonths, subMonths } from 'date-fns'
import { useState, useEffect } from 'react'
import { getGreeting, getIndianDate, getIndianHour } from '../utils/indianTime'
import { fetchWeather } from '../utils/weather'
import { getShiftInfo } from '../utils/shiftCodes'

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

function Header({ view, setView, hasData, selectedMonth, onMonthChange, loading, todayShift }) {
  const [greeting, setGreeting] = useState(getGreeting())
  const [currentTime, setCurrentTime] = useState(getIndianDate())
  const [weather, setWeather] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const shiftSubtitle = getShiftSubtitle(todayShift)
  
  // Update time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(getIndianDate())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

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

  return (
    <header className="surface-1 border-b border-amber-900/30">
      {/* Main Header Row */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Left: Logo + Greeting */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="w-11 h-11 rounded-xl sunflower-gradient flex items-center justify-center shadow-lg">
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
          <div className="flex items-center gap-2">
            {/* Month Navigation */}
            <div className="flex items-center rounded-lg surface-2 border border-amber-900/20">
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
            </div>

            {/* View Toggle */}
            {hasData && (
              <nav className="flex items-center gap-0.5 p-0.5 rounded-lg surface-2 border border-amber-900/20">
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
          </div>
        </div>
      </div>
      
      {/* Info Strip - Shift + Weather (always visible) */}
      <div 
        className="px-4 py-2 bg-amber-950/20 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto text-xs">
          {/* Shift Info */}
          {shiftSubtitle && (
            <span className="flex items-center gap-1.5 text-amber-300">
              <span>{shiftSubtitle.icon}</span>
              <span className="font-medium">{shiftSubtitle.text}</span>
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
    </header>
  )
}

export default Header
