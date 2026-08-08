import { useState, useMemo, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, subDays, previousFriday } from 'date-fns'
import { SHIFT_CODE_OPTIONS, getShiftInfo, WORK_SHIFTS } from '../utils/shiftCodes'

// Get cab booking reminder based on shift and day
function getCabReminder(shift, date) {
  if (!shift || !WORK_SHIFTS.includes(shift)) return null
  
  const dayOfWeek = getDay(date) // 0 = Sunday, 1 = Monday, ...
  const shiftInfo = getShiftInfo(shift)
  
  // Get booking date
  let bookingDate
  if (dayOfWeek === 1) { // Monday - book by previous Friday
    bookingDate = previousFriday(date)
  } else {
    bookingDate = subDays(date, 1) // 1 day before
  }
  
  const bookByText = format(bookingDate, 'EEE, MMM d')
  const isMonday = dayOfWeek === 1
  
  return {
    timing: shiftInfo.timing,
    bookBy: bookByText,
    isMonday,
    emoji: shiftInfo.emoji
  }
}

function RosterInput({ onSave, existingData, selectedMonth: initialMonth, userNames: initialNames }) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || new Date())
  const [roster, setRoster] = useState({})
  const [quickFillA, setQuickFillA] = useState('')
  const [quickFillB, setQuickFillB] = useState('')
  const [names, setNames] = useState(initialNames || { userA: 'User A', userB: 'User B' })
  const initialLoadDone = useRef(false)

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  }), [selectedMonth])

  // Load existing data only on initial mount
  useEffect(() => {
    if (existingData && !initialLoadDone.current) {
      setRoster(existingData)
      initialLoadDone.current = true
    }
  }, [existingData])

  // Reset initial load flag when month changes (allow loading new month's data)
  useEffect(() => {
    initialLoadDone.current = false
    if (existingData) {
      setRoster(existingData)
      initialLoadDone.current = true
    }
  }, [selectedMonth])

  // Update names when initialNames changes
  useEffect(() => {
    if (initialNames) {
      setNames(initialNames)
    }
  }, [initialNames])

  const handleShiftChange = (dateKey, user, value) => {
    setRoster(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [user]: value
      }
    }))
  }

  const handleQuickFill = (user) => {
    const value = user === 'userA' ? quickFillA : quickFillB
    if (!value) return

    const newRoster = { ...roster }
    daysInMonth.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      if (!newRoster[key]) newRoster[key] = {}
      newRoster[key][user] = value
    })
    setRoster(newRoster)
  }

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1))
  }

  const handleSave = () => {
    onSave(roster, selectedMonth, names)
  }

  // Check if form has data
  const hasData = Object.keys(roster).some(key => 
    roster[key]?.userA || roster[key]?.userB
  )

  return (
    <div className="min-h-full px-4 py-4 pb-28">
      <div className="max-w-lg mx-auto">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6 p-4 rounded-2xl surface-1 border border-zinc-800/50">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-xl surface-2 hover:bg-zinc-700 transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold font-display text-white tracking-tight">
              {format(selectedMonth, 'MMMM')}
            </h2>
            <span className="text-zinc-400 text-sm font-medium">{format(selectedMonth, 'yyyy')}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl surface-2 hover:bg-zinc-700 transition-all flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* User Names */}
        <div className="mb-5 p-4 rounded-2xl surface-1 border border-amber-900/30">
          <h3 className="text-xs font-bold text-amber-400/70 mb-4 uppercase tracking-widest font-display flex items-center gap-2">
            <span>🌻</span> Names
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg sunflower-gradient flex items-center justify-center text-lg shrink-0 shadow-md">🌻</div>
              <input
                type="text"
                value={names.userA}
                onChange={(e) => setNames(prev => ({ ...prev, userA: e.target.value }))}
                placeholder="Her name"
                className="flex-1 px-3 py-2 rounded-xl surface-2 border border-amber-500/30 text-amber-100 text-sm font-medium focus:outline-none focus:border-amber-400 placeholder-zinc-600"
              />
              <span className="text-amber-400 text-xs">✨</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-white text-sm font-bold shrink-0">P</div>
              <input
                type="text"
                value={names.userB}
                onChange={(e) => setNames(prev => ({ ...prev, userB: e.target.value }))}
                placeholder="Your name"
                className="flex-1 px-3 py-2 rounded-xl surface-2 border border-zinc-700 text-white text-sm font-medium focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Quick Fill */}
        <div className="mb-6 p-4 rounded-2xl surface-1 border border-amber-900/20">
          <h3 className="text-xs font-bold text-amber-400/70 mb-4 uppercase tracking-widest font-display">Quick Fill</h3>
          <div className="space-y-3">
            {/* User A Quick Fill - Snehaa's special styling */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg sunflower-gradient flex items-center justify-center text-lg shrink-0">
                🌻
              </div>
              <select
                value={quickFillA}
                onChange={(e) => setQuickFillA(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 rounded-lg bg-zinc-800 border border-amber-500/30 text-amber-100 text-sm font-medium focus:outline-none focus:border-amber-400"
              >
                <option value="" className="bg-zinc-900">Select shift...</option>
                {SHIFT_CODE_OPTIONS.map(code => (
                  <option key={code} value={code} className="bg-zinc-900">{getShiftInfo(code).emoji} {code}</option>
                ))}
              </select>
              <button
                onClick={() => handleQuickFill('userA')}
                disabled={!quickFillA}
                className="px-3 py-2 rounded-lg sunflower-gradient hover:opacity-90 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-bold transition-all shrink-0 shadow-md"
              >
                Fill 🌻
              </button>
            </div>
            
            {/* User B Quick Fill */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl surface-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(names.userB || 'P').charAt(0)}
              </div>
              <select
                value={quickFillB}
                onChange={(e) => setQuickFillB(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium focus:outline-none focus:border-zinc-500"
              >
                <option value="" className="bg-zinc-900">Select shift...</option>
                {SHIFT_CODE_OPTIONS.map(code => (
                  <option key={code} value={code} className="bg-zinc-900">{getShiftInfo(code).emoji} {code}</option>
                ))}
              </select>
              <button
                onClick={() => handleQuickFill('userB')}
                disabled={!quickFillB}
                className="px-3 py-2 rounded-lg bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-bold transition-all shrink-0"
              >
                Fill All
              </button>
            </div>
          </div>
        </div>

        {/* Day-by-Day Input */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-amber-400/70 mb-4 uppercase tracking-widest font-display flex items-center gap-2">
            <span>📅</span> Daily Roster
          </h3>
          
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayName = format(day, 'EEE')
            const dayNum = format(day, 'd')
            const isWeekend = [0, 6].includes(day.getDay())
            const dayData = roster[dateKey] || {}
            const isMatch = dayData.userA && dayData.userB && dayData.userA === dayData.userB

            return (
              <div 
                key={dateKey}
                className={`p-3.5 rounded-2xl transition-all ${
                  isMatch
                    ? 'surface-1 border border-amber-400/40 bg-amber-500/5'
                    : isWeekend 
                      ? 'surface-2' 
                      : 'surface-1 border border-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Date */}
                  <div className={`w-12 text-center ${isWeekend ? 'text-zinc-600' : isMatch ? 'text-amber-300' : 'text-zinc-300'}`}>
                    <div className="text-[10px] uppercase font-medium tracking-wider text-zinc-500">{dayName}</div>
                    <div className="text-lg font-semibold">{dayNum}</div>
                  </div>

                  {/* User A Select - Snehaa */}
                  <div className="flex-1">
                    <label className="block text-[10px] text-amber-400/80 mb-1 font-medium">🌻</label>
                    <select
                      value={dayData.userA || ''}
                      onChange={(e) => handleShiftChange(dateKey, 'userA', e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all ${
                        dayData.userA 
                          ? `${getShiftInfo(dayData.userA).color} text-white`
                          : 'surface-2 border border-amber-500/30 text-zinc-400'
                      }`}
                    >
                      <option value="" className="bg-zinc-900">-</option>
                      {SHIFT_CODE_OPTIONS.map(code => (
                        <option key={code} value={code} className="bg-zinc-900">{code}</option>
                      ))}
                    </select>
                  </div>

                  {/* User B Select */}
                  <div className="flex-1">
                    <label className="block text-[10px] text-zinc-500 mb-1 font-medium">P</label>
                    <select
                      value={dayData.userB || ''}
                      onChange={(e) => handleShiftChange(dateKey, 'userB', e.target.value)}
                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all ${
                        dayData.userB 
                          ? `${getShiftInfo(dayData.userB).color} text-white`
                          : 'surface-2 border border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <option value="" className="bg-zinc-900">-</option>
                      {SHIFT_CODE_OPTIONS.map(code => (
                        <option key={code} value={code} className="bg-zinc-900">{code}</option>
                      ))}
                    </select>
                  </div>

                  {/* Match Indicator */}
                  <div className="w-8 text-center">
                    {dayData.userA && dayData.userB && (
                      isMatch 
                        ? <span className="inline-flex w-6 h-6 rounded-md bg-amber-500/20 items-center justify-center">
                            <span className="text-sm">🌻</span>
                          </span>
                        : <span className="inline-flex w-6 h-6 rounded-md bg-zinc-700/50 items-center justify-center">
                            <span className="text-xs">💭</span>
                          </span>
                    )}
                  </div>
                </div>
                
                {/* Cab Booking Reminders */}
                {(dayData.userA || dayData.userB) && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/50 space-y-1.5">
                    {dayData.userA && WORK_SHIFTS.includes(dayData.userA) && (() => {
                      const reminder = getCabReminder(dayData.userA, day)
                      return reminder && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <span className="text-xs">🚖</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-amber-400/90 font-medium">
                              {names.userA}: Book cab for {reminder.emoji} {getShiftInfo(dayData.userA).label}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {reminder.timing} • Book by <span className="text-amber-400">{reminder.bookBy}</span>
                              {reminder.isMonday && <span className="text-amber-400"> (weekend ahead!)</span>}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                    {dayData.userB && WORK_SHIFTS.includes(dayData.userB) && (() => {
                      const reminder = getCabReminder(dayData.userB, day)
                      return reminder && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-700/30 border border-zinc-600/30">
                          <span className="text-xs">🚖</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-zinc-400 font-medium">
                              {names.userB}: Book cab for {reminder.emoji} {getShiftInfo(dayData.userB).label}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {reminder.timing} • Book by <span className="text-zinc-400">{reminder.bookBy}</span>
                              {reminder.isMonday && <span className="text-amber-400"> (weekend ahead!)</span>}
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Shift Legend */}
        <div className="mt-6 p-4 rounded-2xl surface-1 border border-amber-900/20">
          <h4 className="text-xs font-bold text-amber-400/70 mb-4 uppercase tracking-widest font-display flex items-center gap-2">
            <span>📋</span> Shift Codes
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {SHIFT_CODE_OPTIONS.map(code => {
              const info = getShiftInfo(code)
              return (
                <div key={code} className="flex items-center gap-3 p-2.5 rounded-xl surface-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${info.color} text-white font-bold shadow-sm`}>
                    {code}
                  </div>
                  <div className="flex-1">
                    <span className="text-zinc-300 text-sm font-medium">{info.label}</span>
                    {info.timing && (
                      <span className="text-zinc-500 text-xs ml-2">({info.timing})</span>
                    )}
                  </div>
                  <span className="text-lg">{info.emoji}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={!hasData}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sunflower-gradient text-white shadow-lg glow-accent"
          >
            <span className="flex items-center justify-center gap-2">
              🌻 Save for Snehaa
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RosterInput
