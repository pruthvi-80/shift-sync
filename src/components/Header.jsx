import { format, addMonths, subMonths } from 'date-fns'
import { useState, useEffect } from 'react'
import { getGreeting, getIndianDate } from '../utils/indianTime'

function Header({ view, setView, hasData, selectedMonth, onMonthChange, loading }) {
  const [greeting, setGreeting] = useState(getGreeting())
  const [currentTime, setCurrentTime] = useState(getIndianDate())
  const [expanded, setExpanded] = useState(false)
  
  // Update time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(getIndianDate())
    }, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  // Update greeting every minute (separate interval)
  useEffect(() => {
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000)
    return () => clearInterval(greetingInterval)
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
    <header className="px-3 py-2 surface-1 border-b border-amber-900/30">
      <div className="flex items-center justify-between max-w-lg mx-auto gap-2">
        {/* Left: Logo + Greeting */}
        <div 
          className="flex items-center gap-2 min-w-0 flex-shrink cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-9 h-9 rounded-lg sunflower-gradient flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-base">🌻</span>
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm font-bold text-amber-100 font-display ${expanded ? '' : 'truncate'}`}>
              {greeting.text}
            </h1>
            <div className={`flex items-center gap-1.5 text-[10px] ${expanded ? 'flex-wrap' : ''}`}>
              <span className={`text-amber-400/70 ${expanded ? '' : 'truncate'}`}>{greeting.subtitle}</span>
              <span className="text-amber-600">•</span>
              <span className="text-amber-300 font-medium whitespace-nowrap">{timeString}</span>
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
    </header>
  )
}

export default Header
