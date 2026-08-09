import { useState, useEffect, useRef, useCallback } from 'react'
import { format, getDay, subDays, previousFriday } from 'date-fns'
import { getShiftInfo, WORK_SHIFTS } from '../utils/shiftCodes'
import { fireHearts } from '../utils/confetti'
import { isIndianToday, getIndianHour } from '../utils/indianTime'

// Work tips with emojis - shown for work shifts
const WORK_TIPS = [
  { icon: '🔐', text: 'Grab your credentials from BeyondTrust' },
  { icon: '🎫', text: 'Check incidents, SRs & CRs assigned to you' },
  { icon: '📧', text: 'Catch up on your emails' },
]

// Week off tips - for weekly offs
const WEEKOFF_TIPS = [
  { icon: '💤', text: 'Sleep in, you deserve it!' },
  { icon: '🍿', text: 'Binge that series you\'ve been saving' },
  { icon: '🍳', text: 'Cook something yummy for yourself' },
  { icon: '🧽', text: 'Self-care time! Face mask? Skincare?' },
  { icon: '📱', text: 'Call someone you\'ve been meaning to' },
]

// Leave tips - for planned leaves
const LEAVE_TIPS = [
  { icon: '✈️', text: 'Travel safe & have fun!' },
  { icon: '📸', text: 'Click lots of pictures!' },
  { icon: '🌴', text: 'Disconnect & enjoy the moment' },
  { icon: '🌟', text: 'Make some amazing memories!' },
  { icon: '💛', text: 'You earned this break, enjoy!' },
]

// Get shift label - with or without "Today/Tonight" prefix
function getShiftLabel(shift, isToday = false) {
  if (!shift) return null
  
  const info = getShiftInfo(shift)
  
  // Get prefix for today
  let prefix = ''
  if (isToday) {
    const hour = getIndianHour()
    const isNight = hour >= 21 || hour < 6
    prefix = isNight ? 'Tonight: ' : 'Today: '
  }
  
  // Work shifts
  if (shift === 'N') return `${prefix}Night Shift`
  if (shift === 'M') return `${prefix}Morning Shift`
  if (shift === 'A') return `${prefix}Afternoon Shift`
  if (shift === 'US1') return `${prefix}US Shift`
  if (shift === 'STS') return `${prefix}General Shift`
  
  // Off days
  if (shift === 'WO') return `${prefix}Week Off!`
  if (shift === 'H') return `${prefix}Holiday!`
  if (shift === 'L') return `${prefix}On Leave`
  if (shift === 'EL') return `${prefix}Emergency Leave`
  if (shift === 'CO') return `${prefix}Comp Off!`
  if (shift === 'SDO') return `${prefix}Special Day Off!`
  
  return `${prefix}${info.label}`
}

// Get cab booking reminder
function getCabReminder(shift, date) {
  if (!shift || !WORK_SHIFTS.includes(shift)) return null
  
  const dayOfWeek = getDay(date)
  const shiftInfo = getShiftInfo(shift)
  
  let bookingDate
  if (dayOfWeek === 1) {
    bookingDate = previousFriday(date)
  } else {
    bookingDate = subDays(date, 1)
  }
  
  return {
    timing: shiftInfo.timing,
    bookBy: format(bookingDate, 'EEE, MMM d'),
    isMonday: dayOfWeek === 1,
    emoji: shiftInfo.emoji
  }
}

// Track shown effects outside component
const shownEffectDates = new Set()
let lastEffectTime = 0
const EFFECT_COOLDOWN_MS = 8000

// Time-of-day theme configurations
const getShiftTheme = (shift) => {
  switch(shift) {
    case 'M': // Morning
      return {
        bg: 'from-orange-900/40 via-amber-800/30 to-yellow-700/20',
        accent: 'amber-400',
        icon: '🌅',
        scene: 'morning',
        particles: ['☀️', '🌤️', '✨', '🐦'],
        greeting: 'Rise & Shine!',
        colors: { primary: '#fbbf24', secondary: '#f97316' }
      }
    case 'A': // Afternoon
      return {
        bg: 'from-amber-800/40 via-orange-700/30 to-yellow-600/20',
        accent: 'yellow-400',
        icon: '☀️',
        scene: 'afternoon',
        particles: ['☀️', '🌻', '💛', '✨'],
        greeting: 'Sunny Vibes!',
        colors: { primary: '#facc15', secondary: '#fb923c' }
      }
    case 'N': // Night
      return {
        bg: 'from-indigo-900/50 via-purple-900/40 to-slate-900/30',
        accent: 'indigo-400',
        icon: '🌙',
        scene: 'night',
        particles: ['⭐', '🌙', '✨', '💫'],
        greeting: 'Night Owl Mode!',
        colors: { primary: '#818cf8', secondary: '#6366f1' }
      }
    case 'STS': // General shift
      return {
        bg: 'from-orange-800/30 via-amber-700/20 to-yellow-600/15',
        accent: 'orange-300',
        icon: '💼',
        scene: 'work',
        particles: ['💼', '📊', '✨', '⭐'],
        greeting: 'Work Mode!',
        colors: { primary: '#fdba74', secondary: '#fb923c' }
      }
    case 'US1': // US Shift
      return {
        bg: 'from-blue-900/50 via-indigo-800/40 to-purple-900/30',
        accent: 'blue-400',
        icon: '🇺🇸',
        scene: 'night',
        particles: ['🇺🇸', '⭐', '🌙', '✨'],
        greeting: 'US Time!',
        colors: { primary: '#60a5fa', secondary: '#3b82f6' }
      }
    case 'WO': // Week Off
      return {
        bg: 'from-emerald-900/40 via-teal-800/30 to-green-700/20',
        accent: 'emerald-400',
        icon: '😴',
        scene: 'relax',
        particles: ['🌻', '💛', '😴', '🛋️', '🎉', '✨'],
        greeting: 'Rest Day Queen!',
        colors: { primary: '#34d399', secondary: '#10b981' },
        celebration: true
      }
    case 'L': // Leave
      return {
        bg: 'from-violet-900/40 via-purple-800/30 to-fuchsia-700/20',
        accent: 'violet-400',
        icon: '🏖️',
        scene: 'vacation',
        particles: ['🏖️', '🌴', '✨', '🌊', '💛', '🎉'],
        greeting: 'Vacay Time!',
        colors: { primary: '#a78bfa', secondary: '#8b5cf6' },
        celebration: true
      }
    case 'EL': // Emergency Leave
      return {
        bg: 'from-rose-900/40 via-red-800/30 to-pink-700/20',
        accent: 'rose-400',
        icon: '🚨',
        scene: 'rest',
        particles: ['💛', '🌻', '✨', '💪'],
        greeting: 'Take Care!',
        colors: { primary: '#fb7185', secondary: '#f43f5e' },
        celebration: true
      }
    case 'CO': // Comp Off
      return {
        bg: 'from-indigo-900/40 via-blue-800/30 to-violet-700/20',
        accent: 'indigo-400',
        icon: '🎁',
        scene: 'gift',
        particles: ['🎁', '🌻', '💛', '✨', '🎉'],
        greeting: 'Bonus Day!',
        colors: { primary: '#818cf8', secondary: '#6366f1' },
        celebration: true
      }
    case 'H': // Holiday
      return {
        bg: 'from-sky-900/40 via-cyan-800/30 to-teal-700/20',
        accent: 'sky-400',
        icon: '🎉',
        scene: 'celebrate',
        particles: ['🎉', '🎊', '🌻', '💛', '✨', '🎈'],
        greeting: 'Holiday Vibes!',
        colors: { primary: '#38bdf8', secondary: '#0ea5e9' },
        celebration: true
      }
    case 'SDO': // Special Day Off
      return {
        bg: 'from-orange-900/40 via-amber-800/30 to-yellow-700/20',
        accent: 'orange-400',
        icon: '⭐',
        scene: 'special',
        particles: ['⭐', '🌻', '💛', '✨', '🎉'],
        greeting: 'Special Day!',
        colors: { primary: '#fb923c', secondary: '#f97316' },
        celebration: true
      }
    default:
      return {
        bg: 'from-zinc-800/40 via-zinc-700/30 to-zinc-600/20',
        accent: 'zinc-400',
        icon: '📅',
        scene: 'default',
        particles: ['📅', '✨'],
        greeting: 'Today',
        colors: { primary: '#a1a1aa', secondary: '#71717a' }
      }
  }
}

function DailyView({ date, dayData, onPrev, onNext, hasPrev, hasNext, currentIndex, totalDays, userNames = { userA: 'Snehaa 🌻' } }) {
  const [slideDirection, setSlideDirection] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [tipsHidden, setTipsHidden] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const containerRef = useRef(null)
  const effectTimerRef = useRef(null)

  const shift = dayData?.userA
  const shiftInfo = getShiftInfo(shift)
  const theme = getShiftTheme(shift)
  const isWorkShift = WORK_SHIFTS.includes(shift)
  const isOffDay = ['WO', 'L', 'EL', 'CO', 'H', 'SDO'].includes(shift)
  const isWeekOff = shift === 'WO'
  const isLeave = ['L', 'EL', 'CO'].includes(shift)

  // Get current tips array based on shift type
  const getCurrentTips = () => {
    if (isWorkShift) return WORK_TIPS
    if (isWeekOff) return WEEKOFF_TIPS
    if (isLeave) return LEAVE_TIPS
    return []
  }
  const currentTips = getCurrentTips()
  const hasTips = currentTips.length > 0 && isIndianToday(date)

  // Rotate tips every 8 seconds
  useEffect(() => {
    if (!hasTips) return
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % currentTips.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [hasTips, currentTips.length])

  // Trigger celebration effects for off days
  useEffect(() => {
    if (effectTimerRef.current) {
      clearTimeout(effectTimerRef.current)
      effectTimerRef.current = null
    }

    if (!dayData || !date || !theme.celebration) return

    const dateKey = format(date, 'yyyy-MM-dd')
    if (shownEffectDates.has(dateKey)) return
    
    const now = Date.now()
    if (now - lastEffectTime < EFFECT_COOLDOWN_MS) return

    effectTimerRef.current = setTimeout(() => {
      if (Date.now() - lastEffectTime < EFFECT_COOLDOWN_MS) return
      shownEffectDates.add(dateKey)
      lastEffectTime = Date.now()
      fireHearts()
    }, 600)

    return () => {
      if (effectTimerRef.current) {
        clearTimeout(effectTimerRef.current)
        effectTimerRef.current = null
      }
    }
  }, [date, dayData, theme.celebration])

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX // Reset to start position
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (Math.abs(diff) > threshold && !isAnimating) {
      if (diff > 0 && hasNext) {
        // Swiped left - go to next day
        setSlideDirection('left')
        setIsAnimating(true)
        setTimeout(() => {
          onNext()
          setIsAnimating(false)
        }, 200)
      } else if (diff < 0 && hasPrev) {
        // Swiped right - go to previous day
        setSlideDirection('right')
        setIsAnimating(true)
        setTimeout(() => {
          onPrev()
          setIsAnimating(false)
        }, 200)
      }
    }
  }, [hasNext, hasPrev, onNext, onPrev, isAnimating])

  const handlePrev = useCallback(() => {
    if (hasPrev && !isAnimating) {
      setSlideDirection('right')
      setIsAnimating(true)
      setTimeout(() => {
        onPrev()
        setIsAnimating(false)
      }, 200)
    }
  }, [hasPrev, isAnimating, onPrev])

  const handleNext = useCallback(() => {
    if (hasNext && !isAnimating) {
      setSlideDirection('left')
      setIsAnimating(true)
      setTimeout(() => {
        onNext()
        setIsAnimating(false)
      }, 200)
    }
  }, [hasNext, isAnimating, onNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  if (!date) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400">No date selected</p>
      </div>
    )
  }

  const dayName = format(date, 'EEEE')
  const dateStr = format(date, 'MMMM d, yyyy')

  return (
    <div 
      ref={containerRef}
      className="min-h-full flex flex-col select-none"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Date Header */}
      <div className="text-center py-4 fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full surface-2 mb-3">
          <span className="text-xs font-medium text-zinc-400 tracking-wide">{currentIndex + 1} of {totalDays}</span>
        </div>
        <h2 className="text-3xl font-bold font-display text-white tracking-tight mb-1">{dayName}</h2>
        <p className="text-zinc-400 text-sm font-medium tracking-wide">{dateStr}</p>
      </div>

      {/* Main Shift Display */}
      <div className={`flex-1 flex flex-col px-4 pb-4 transition-all duration-200 ${
        isAnimating 
          ? slideDirection === 'left' 
            ? '-translate-x-full opacity-0' 
            : 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}>
        {dayData && shift ? (
          <div className="max-w-md mx-auto w-full space-y-4">
            {/* Main Shift Card with Time-of-Day Theme */}
            <div 
              className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${theme.bg} border ${isOffDay ? 'border-amber-400/40' : 'border-white/10'}`}
              style={isOffDay ? { boxShadow: `0 0 30px ${theme.colors.primary}30` } : {}}
            >
              
              {/* Floating Particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {theme.particles.map((particle, i) => (
                  <span 
                    key={i}
                    className={`absolute text-2xl opacity-20 ${isOffDay ? 'animate-float-celebration' : 'animate-float-slow'}`}
                    style={{
                      top: `${10 + (i * 20) % 80}%`,
                      left: `${5 + (i * 25) % 90}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: `${3 + i * 0.5}s`
                    }}
                  >
                    {particle}
                  </span>
                ))}
              </div>

              {/* Scene Background Elements */}
              {theme.scene === 'morning' && (
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-30 blur-lg" />
              )}
              {theme.scene === 'afternoon' && (
                <div className="absolute top-2 right-6 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 opacity-40 blur-xl" />
              )}
              {theme.scene === 'night' && (
                <>
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-300 to-purple-400 opacity-30 blur-md" />
                  <div className="absolute top-8 right-16 w-2 h-2 rounded-full bg-white opacity-60" />
                  <div className="absolute top-12 right-8 w-1.5 h-1.5 rounded-full bg-white opacity-40" />
                  <div className="absolute top-6 right-24 w-1 h-1 rounded-full bg-white opacity-50" />
                </>
              )}

              {/* Main Content */}
              <div className="relative z-10">
                {/* Hero Shift Display */}
                <div className="text-center">
                  {/* Large Icon */}
                  <div className="mb-4">
                    <span className={`text-7xl block drop-shadow-2xl ${isOffDay ? 'animate-bounce-slow' : ''}`}>
                      {theme.icon}
                    </span>
                  </div>
                  
                  {/* Shift Label Badge */}
                  <div 
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold shadow-xl mb-3"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                      color: '#000'
                    }}
                  >
                    <span>{getShiftLabel(shift, isIndianToday(date))}</span>
                  </div>
                  
                  {/* Theme Greeting */}
                  <h3 className="text-lg font-display tracking-wide opacity-80" style={{ color: theme.colors.primary }}>
                    {theme.greeting}
                  </h3>
                </div>

                {/* Info Strip */}
                <div className="mt-6 bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg">🌻</span>
                      </div>
                      <div>
                        <p className="text-amber-100 font-semibold text-sm">{shiftInfo.label}</p>
                        {isWorkShift && shiftInfo.timing && (
                          <p className="text-zinc-400 text-xs">⏰ {shiftInfo.timing}</p>
                        )}
                        {isOffDay && (
                          <p className="text-amber-400/60 text-xs">Enjoy your day! 💛</p>
                        )}
                      </div>
                    </div>
                    {isOffDay && (
                      <span className="text-2xl animate-bounce-slow">🎉</span>
                    )}
                  </div>
                </div>

                {/* Tips - Rotating (Work, Week Off, or Leave) */}
                {hasTips && (
                  <div className="mt-4">
                    {!tipsHidden ? (
                      <div className="animate-fade-in">
                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-2">
                          <span>{isWorkShift ? '💡' : isWeekOff ? '😴' : '✨'}</span>
                          <span className="font-medium">
                            {isWorkShift ? 'Quick Reminder' : isWeekOff ? 'Week Off Vibes' : 'Vacay Mode'}
                          </span>
                        </div>
                        <div 
                          className={`rounded-xl p-3 border transition-all duration-500 relative ${
                            isWorkShift 
                              ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/20' 
                              : isWeekOff
                              ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/5 border-purple-500/20'
                              : 'bg-gradient-to-r from-cyan-500/10 to-teal-500/5 border-cyan-500/20'
                          }`}
                          key={currentTipIndex}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); setTipsHidden(true); }}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all shadow-lg border border-zinc-700 active:scale-90"
                          >
                            <span className="text-xs leading-none">✕</span>
                          </button>
                          <div className="flex items-center gap-3 animate-fade-in">
                            <span className="text-xl">{currentTips[currentTipIndex]?.icon}</span>
                            <p className={`text-sm font-medium ${
                              isWorkShift ? 'text-amber-200/90' : isWeekOff ? 'text-purple-200/90' : 'text-cyan-200/90'
                            }`}>{currentTips[currentTipIndex]?.text}</p>
                          </div>
                        </div>
                        <div className="flex justify-center gap-1.5 mt-2">
                          {currentTips.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setCurrentTipIndex(idx); }}
                              onTouchStart={(e) => e.stopPropagation()}
                              onTouchEnd={(e) => e.stopPropagation()}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentTipIndex 
                                  ? `${isWorkShift ? 'bg-amber-400' : isWeekOff ? 'bg-purple-400' : 'bg-cyan-400'} w-4` 
                                  : 'bg-zinc-600 hover:bg-zinc-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setTipsHidden(false); }}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        className={`mx-auto flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-full text-xs text-zinc-400 transition-all border border-zinc-700/50 animate-fade-in active:scale-95 ${
                          isWorkShift ? 'hover:text-amber-400 hover:border-amber-500/30' 
                          : isWeekOff ? 'hover:text-purple-400 hover:border-purple-500/30'
                          : 'hover:text-cyan-400 hover:border-cyan-500/30'
                        }`}
                      >
                        <span>{isWorkShift ? '💡' : isWeekOff ? '😴' : '✨'}</span>
                        <span>Show tips</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Off Day Special Message - Only for holidays and SDO (no tips) */}
                {isOffDay && !hasTips && (
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium opacity-70" style={{ color: theme.colors.primary }}>
                      {shift === 'H' && '🎉 Holiday mood activated!'}
                      {shift === 'SDO' && '⭐ Special day, special queen!'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cab Booking Reminder - Only for work shifts */}
            {isWorkShift && (() => {
              const dayOfWeek = getDay(date)
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const reminder = getCabReminder(shift, date)
              
              return (
                <div className="p-4 rounded-2xl surface-1 border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚖</span>
                      <h4 className="text-sm font-bold text-amber-400 font-display">Routematic Cab</h4>
                    </div>
                    <a 
                      href="intent://scan/#Intent;scheme=zxing;package=com.routematic.employee;end"
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.preventDefault()
                        const isAndroid = /android/i.test(navigator.userAgent)
                        if (isAndroid) {
                          window.location.href = 'market://launch?id=com.routematic.employee'
                        } else {
                          window.open('https://play.google.com/store/apps/details?id=com.routematic.employee', '_blank')
                        }
                      }}
                    >
                      <span>📱</span>
                      <span>Open App</span>
                    </a>
                  </div>
                  
                  {isWeekend ? (
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-[11px] text-orange-300 text-center">
                        ⚠️ Cab booking not available on weekends
                      </p>
                    </div>
                  ) : reminder && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Timing:</span>
                        <span className="text-amber-200 font-semibold">{shiftInfo.timing}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Book by:</span>
                        <span className="text-amber-400 font-bold">{reminder.bookBy}</span>
                        {reminder.isMonday && <span className="text-orange-400 text-[10px]">🚨 Friday!</span>}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-amber-400/50 mt-3 text-center italic">
                    💛 Don't forget to book... unless you've got Ola/Uber money 💸 💛
                  </p>
                </div>
              )
            })()}

            {/* Quick Routematic Access for Off Days */}
            {isOffDay && (
              <div className="p-3 rounded-xl surface-1 border border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Quick access</span>
                  <a 
                    href="#"
                    className="px-2 py-1 rounded-lg bg-zinc-700/50 text-zinc-400 text-xs flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault()
                      const isAndroid = /android/i.test(navigator.userAgent)
                      if (isAndroid) {
                        window.location.href = 'market://launch?id=com.routematic.employee'
                      } else {
                        window.open('https://play.google.com/store/apps/details?id=com.routematic.employee', '_blank')
                      }
                    }}
                  >
                    <span>🚖</span>
                    <span>Routematic</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl surface-2 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
            <p className="text-zinc-400 font-medium">No shift data for this day</p>
            <p className="text-zinc-500 text-sm mt-1">Add shifts in the Edit section</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent mt-auto">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handlePrev}
            disabled={!hasPrev || isAnimating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              hasPrev
                ? 'surface-1 border border-amber-900/30 hover:border-amber-700/50 text-zinc-300 active:scale-[0.98]'
                : 'surface-2 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg surface-2 border border-amber-900/20">
            <span className="text-xs font-medium text-amber-300">{currentIndex + 1}</span>
            <span className="text-xs text-zinc-600">/</span>
            <span className="text-xs text-zinc-500">{totalDays}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={!hasNext || isAnimating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              hasNext
                ? 'surface-1 border border-amber-900/30 hover:border-amber-700/50 text-zinc-300 active:scale-[0.98]'
                : 'surface-2 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DailyView
