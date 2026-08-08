import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { format, getDay, subDays, previousFriday } from 'date-fns'
import { getShiftInfo, getMatchStatus, WORK_SHIFTS } from '../utils/shiftCodes'
import { fireMatchConfetti, fireHearts, fireSadEffect } from '../utils/confetti'
import ShiftCard from './ShiftCard'

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

function DailyView({ date, dayData, onPrev, onNext, hasPrev, hasNext, currentIndex, totalDays, userNames = { userA: 'User A', userB: 'User B' } }) {
  const [slideDirection, setSlideDirection] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasShownEffect, setHasShownEffect] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const containerRef = useRef(null)

  const shiftA = dayData?.userA
  const shiftB = dayData?.userB
  const matchStatus = getMatchStatus(shiftA, shiftB)

  // Trigger effects when day changes
  useEffect(() => {
    if (!hasShownEffect && dayData) {
      setHasShownEffect(true)
      
      // Delay effect slightly for better UX
      const timer = setTimeout(() => {
        if (matchStatus.match) {
          if (matchStatus.type === 'leave') {
            fireHearts()
          } else {
            fireMatchConfetti()
          }
        }
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [dayData, matchStatus.match, matchStatus.type, hasShownEffect])

  // Reset effect flag when day changes
  useEffect(() => {
    setHasShownEffect(false)
  }, [currentIndex])

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && hasNext) {
        setSlideDirection('left')
        setIsAnimating(true)
        setTimeout(() => {
          onNext()
          setIsAnimating(false)
        }, 200)
      } else if (diff < 0 && hasPrev) {
        setSlideDirection('right')
        setIsAnimating(true)
        setTimeout(() => {
          onPrev()
          setIsAnimating(false)
        }, 200)
      }
    }
  }, [hasNext, hasPrev, onNext, onPrev])

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
      style={{ touchAction: 'pan-y pan-x' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Date Header */}
      <div className="text-center py-6 fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full surface-2 mb-4">
          <span className="text-xs font-medium text-zinc-400 tracking-wide">{currentIndex + 1} of {totalDays}</span>
        </div>
        <h2 className="text-4xl font-bold font-display text-white tracking-tight mb-2">{dayName}</h2>
        <p className="text-zinc-400 text-base font-medium tracking-wide">{dateStr}</p>
      </div>

      {/* Shift Comparison */}
      <div className={`flex-1 flex flex-col px-4 pb-4 transition-all duration-200 ${
        isAnimating 
          ? slideDirection === 'left' 
            ? '-translate-x-full opacity-0' 
            : 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}>
        {dayData ? (
          <>
            {/* Match Status Banner */}
            <div className={`mb-6 text-center ${matchStatus.match ? 'happy-bounce' : ''}`}>
              {matchStatus.match ? (
                <div className="inline-flex items-center gap-4 px-8 py-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 match-glow">
                  <span className="text-4xl sparkle">🌻</span>
                  <div className="text-left">
                    <span className="block text-amber-300 font-bold text-xl font-display tracking-tight">
                      {matchStatus.type === 'leave' && "Together Time! 💛"}
                      {matchStatus.type === 'weekoff' && "Day Off Together! 🌻"}
                      {matchStatus.type === 'work' && "Same Shift! 💕"}
                    </span>
                    <span className="text-amber-400/70 text-sm font-medium tracking-wide">Blooming together today! 🌼</span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-4 px-8 py-5 rounded-3xl surface-1 border border-zinc-700">
                  <span className="text-3xl">🥺</span>
                  <div className="text-left">
                    <span className="block text-zinc-200 font-bold text-lg font-display">Different Shifts</span>
                    <span className="text-zinc-500 text-sm font-medium">Missing you already! 💭</span>
                  </div>
                </div>
              )}
            </div>

            {/* User Cards */}
            <div className="space-y-3 max-w-md mx-auto w-full">
              <ShiftCard 
                user={userNames.userA} 
                shift={shiftA} 
                isMatch={matchStatus.match}
                delay={0}
                isUserA={true}
              />
              
              {/* Separator - sunflower themed */}
              <div className="flex items-center justify-center py-3">
                <div className={`flex-1 h-0.5 rounded-full ${matchStatus.match ? 'bg-gradient-to-r from-transparent via-amber-400/50 to-transparent' : 'bg-gradient-to-r from-transparent via-zinc-600 to-transparent'}`} />
                <div className={`mx-4 flex items-center gap-2 px-5 py-2.5 rounded-full ${
                  matchStatus.match 
                    ? 'bg-amber-500/20 border border-amber-400/30' 
                    : 'surface-2'
                }`}>
                  {matchStatus.match ? (
                    <>
                      <span className="text-lg sparkle">💛</span>
                      <span className="text-amber-300 text-sm font-bold tracking-widest font-display">TOGETHER</span>
                      <span className="text-lg sparkle">💛</span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-500 text-xs">💭</span>
                    </>
                  )}
                </div>
                <div className={`flex-1 h-0.5 rounded-full ${matchStatus.match ? 'bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent' : 'bg-gradient-to-r from-transparent via-zinc-600 to-transparent'}`} />
              </div>
              
              <ShiftCard 
                user={userNames.userB} 
                shift={shiftB} 
                isMatch={matchStatus.match}
                delay={100}
                isUserA={false}
              />
              
              {/* Cab Booking Reminder */}
              {(WORK_SHIFTS.includes(shiftA) || WORK_SHIFTS.includes(shiftB)) && (
                <div className="mt-4 p-4 rounded-2xl surface-1 border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🚖</span>
                    <h4 className="text-sm font-bold text-amber-400 font-display">Routematic Cab Reminder</h4>
                  </div>
                  <div className="space-y-3">
                    {shiftA && WORK_SHIFTS.includes(shiftA) && (() => {
                      const reminder = getCabReminder(shiftA, date)
                      const shiftInfo = getShiftInfo(shiftA)
                      return reminder && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-md sunflower-gradient flex items-center justify-center text-sm">
                              🌻
                            </span>
                            <span className="text-amber-200 font-semibold text-sm">{userNames.userA}</span>
                          </div>
                          <div className="ml-8 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">Shift:</span>
                              <span className="text-amber-300 font-medium">{shiftInfo.emoji} {shiftInfo.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">Timing:</span>
                              <span className="text-amber-200 font-semibold">{shiftInfo.timing}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">Book by:</span>
                              <span className="text-amber-400 font-bold">{reminder.bookBy}</span>
                              {reminder.isMonday && <span className="text-orange-400">🚨 Friday!</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    {shiftB && WORK_SHIFTS.includes(shiftB) && (() => {
                      const reminder = getCabReminder(shiftB, date)
                      const shiftInfo = getShiftInfo(shiftB)
                      return reminder && (
                        <div className="p-3 rounded-xl bg-zinc-700/30 border border-zinc-600/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-md bg-zinc-600 flex items-center justify-center text-zinc-300 font-bold text-[10px]">
                              {userNames.userB.charAt(0)}
                            </span>
                            <span className="text-zinc-300 font-semibold text-sm">{userNames.userB}</span>
                          </div>
                          <div className="ml-8 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">Shift:</span>
                              <span className="text-zinc-300 font-medium">{shiftInfo.emoji} {shiftInfo.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">Timing:</span>
                              <span className="text-zinc-200 font-semibold">{shiftInfo.timing}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">Book by:</span>
                              <span className="text-zinc-300 font-bold">{reminder.bookBy}</span>
                              {reminder.isMonday && <span className="text-orange-400">🚨 Friday!</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <p className="text-[10px] text-amber-400/50 mt-3 text-center italic">
                    💛 Book early for a smooth ride! 💛
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl surface-2 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
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
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Progress indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg surface-2 border border-amber-900/20">
            <span className="text-xs font-medium text-amber-300">{currentIndex + 1}</span>
            <span className="text-amber-600">/</span>
            <span className="text-xs text-zinc-500">{totalDays}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={!hasNext || isAnimating}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              hasNext
                ? 'sunflower-gradient text-white active:scale-[0.98] shadow-md'
                : 'surface-2 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
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
