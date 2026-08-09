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
    <header className={`px-3 py-2 surface-1 ${expanded ? '' : 'border-b border-amber-900/30'}`}>
      <div className="flex items-center justify-between max-w-lg mx-auto gap-2">
        {/* Left: Logo + Greeting + Weather */}
        <div 
          className="flex items-center gap-2 min-w-0 flex-shrink cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-10 h-10 rounded-lg sunflower-gradient flex items-center justify-center shadow-lg flex-shrink-0 overflow-visible">
            <span className="text-xl leading-none">🌻</span>
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm font-bold text-amber-100 font-display ${expanded ? '' : 'truncate'}`}>
              {greeting.text}
            </h1>
            <div className={`flex items-center gap-1.5 text-[10px] ${expanded ? 'flex-wrap' : ''}`}>
              <span className={`text-amber-400/70 ${expanded ? '' : 'truncate max-w-[100px]'}`}>
                {shiftSubtitle ? shiftSubtitle.text : greeting.subtitle}
              </span>
              <span className="text-amber-600">•</span>
              <span className="text-amber-300 font-medium whitespace-nowrap">{timeString}</span>
              {weather && (
                <>
                  <span className="text-amber-600">•</span>
                  <span className="flex items-center gap-0.5 text-zinc-400 whitespace-nowrap" title={`${weather.location}: ${weather.desc}`}>
                    <span className="text-sm">{weather.icon}</span>
                    <span className="font-medium">{weather.temp}°</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Right: Month Nav + View Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Month Navigation */}
          <div className="flex items-center rounded-lg surface-2 border border-amber-900/20">
            <button
              onClick={handlePrevMonth}
              disabled={loading}
              className="p-1.5 text-zinc-400 hover:text-amber-300 transition-all disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-1.5 text-xs font-semibold text-amber-200 whitespace-nowrap">
              {monthYearString}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={loading}
              className="p-1.5 text-zinc-400 hover:text-amber-300 transition-all disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      
      {/* Expanded Weather Detail */}
      {expanded && weather && (
        <div className="mt-2 pt-2 pb-2 border-t border-b border-amber-900/30 max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">{weather.icon}</span>
              <span className="text-amber-200 font-semibold">{weather.temp}°C • {weather.desc}</span>
            </div>
            <p className="text-amber-400/60 text-[11px]">📍 {weather.location}</p>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
