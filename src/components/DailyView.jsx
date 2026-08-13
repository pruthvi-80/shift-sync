import { useState, useEffect, useRef, useCallback } from 'react'
import { format, getDay, subDays, previousFriday, addDays, differenceInDays, isSameDay } from 'date-fns'
import { getShiftInfo, WORK_SHIFTS } from '../utils/shiftCodes'
import { fireHearts } from '../utils/confetti'
import { isIndianToday, getIndianHour, getIndianDate } from '../utils/indianTime'

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

// Quick Actions Component
function QuickActions({ date, shift, shiftInfo }) {
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [imageBlob, setImageBlob] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const isOff = ['WO', 'L', 'EL', 'CO', 'H', 'SDO'].includes(shift)

  // Generate shareable text
  const getShareText = () => {
    const dateStr = format(date, 'EEEE, MMMM d, yyyy')
    
    if (isOff) {
      return `📅 ${dateStr}\n${shiftInfo.emoji} ${shiftInfo.label}\n\n🌻 Snehaa's Shift Roster`
    }
    return `📅 ${dateStr}\n${shiftInfo.emoji} ${shiftInfo.label}\n⏰ ${shiftInfo.timing}\n\n🌻 Snehaa's Shift Roster`
  }

  // Generate shareable image
  const generateShareImage = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const width = 600
    const height = 400
    canvas.width = width
    canvas.height = height

    // Background gradient based on shift
    let gradientColors
    if (shift === 'N') gradientColors = ['#1e1b4b', '#312e81', '#1e1b4b']
    else if (shift === 'M') gradientColors = ['#78350f', '#b45309', '#78350f']
    else if (shift === 'A') gradientColors = ['#713f12', '#ca8a04', '#713f12']
    else if (isOff) gradientColors = ['#064e3b', '#047857', '#064e3b']
    else gradientColors = ['#27272a', '#3f3f46', '#27272a']

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, gradientColors[0])
    gradient.addColorStop(0.5, gradientColors[1])
    gradient.addColorStop(1, gradientColors[2])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Decorative circles
    ctx.globalAlpha = 0.1
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(width - 80, 80, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(80, height - 60, 80, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // Border
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
    ctx.lineWidth = 4
    ctx.roundRect(10, 10, width - 20, height - 20, 20)
    ctx.stroke()

    // Date
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'
    ctx.font = '500 18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(format(date, 'EEEE'), width / 2, 70)
    
    ctx.fillStyle = '#fef3c7'
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillText(format(date, 'MMMM d, yyyy'), width / 2, 105)

    // Emoji
    ctx.font = '72px system-ui, sans-serif'
    ctx.fillText(shiftInfo.emoji, width / 2, 195)

    // Shift label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px system-ui, sans-serif'
    ctx.fillText(shiftInfo.label, width / 2, 260)

    // Timing (for work shifts)
    if (!isOff && shiftInfo.timing) {
      ctx.fillStyle = 'rgba(253, 230, 138, 0.9)'
      ctx.font = '500 20px system-ui, sans-serif'
      ctx.fillText(`⏰ ${shiftInfo.timing}`, width / 2, 300)
    }

    // Branding
    ctx.fillStyle = 'rgba(251, 191, 36, 0.6)'
    ctx.font = '500 16px system-ui, sans-serif'
    ctx.fillText('🌻 Snehaa\'s Shift Roster', width / 2, height - 40)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  // Open copy modal
  const handleCopyClick = () => {
    setShowCopyModal(true)
    setCopied(false)
  }

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText())
      setCopied(true)
      setTimeout(() => {
        setShowCopyModal(false)
        setCopied(false)
        setShowToast('Copied to clipboard!')
        setTimeout(() => setShowToast(null), 2000)
      }, 800)
    } catch (err) {
      setShowToast('Failed to copy')
      setTimeout(() => setShowToast(null), 2000)
    }
  }

  // Open share modal and generate image
  const handleShareClick = async () => {
    setShowShareModal(true)
    setIsGenerating(true)
    
    try {
      const blob = await generateShareImage()
      setImageBlob(blob)
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
    } catch (err) {
      setShowToast('Failed to generate image')
      setTimeout(() => setShowToast(null), 2000)
    } finally {
      setIsGenerating(false)
    }
  }

  // Close share modal and cleanup
  const closeShareModal = () => {
    setShowShareModal(false)
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
      setImageUrl(null)
      setImageBlob(null)
    }
  }

  // Download image
  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `shift-${format(date, 'yyyy-MM-dd')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setShowToast('Image downloaded!')
      setTimeout(() => setShowToast(null), 2000)
    }
  }

  // Share image
  const handleShare = async () => {
    if (!imageBlob) return
    
    try {
      const file = new File([imageBlob], `shift-${format(date, 'yyyy-MM-dd')}.png`, { type: 'image/png' })
      
      const shareData = {
        title: `Shift - ${format(date, 'MMM d')}`,
        text: getShareText(),
        files: [file]
      }
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        closeShareModal()
      } else {
        handleDownload()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleDownload()
      }
    }
  }

  // Add to Google Calendar
  const handleGoogleCalendar = () => {
    const dateStr = format(date, 'yyyyMMdd')
    const title = encodeURIComponent(`${shiftInfo.emoji} ${shiftInfo.label}`)
    const details = encodeURIComponent(`Shift: ${shiftInfo.label}${shiftInfo.timing ? `\nTiming: ${shiftInfo.timing}` : ''}\n\n🌻 Snehaa's Shift Roster`)
    
    let url
    if (isOff) {
      url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`
    } else {
      let startTime, endTime
      if (shift === 'M') { startTime = '063000'; endTime = '150000' }
      else if (shift === 'A') { startTime = '143000'; endTime = '230000' }
      else if (shift === 'N') { startTime = '223000'; endTime = '070000' }
      else if (shift === 'STS') { startTime = '090000'; endTime = '180000' }
      else if (shift === 'US1') { startTime = '183000'; endTime = '033000' }
      else { startTime = '090000'; endTime = '180000' }
      
      url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${startTime}/${dateStr}T${endTime}&details=${details}&ctz=Asia/Kolkata`
    }
    
    window.open(url, '_blank')
    setShowToast('Opening Calendar...')
    setTimeout(() => setShowToast(null), 2000)
  }

  // Google Calendar icon component
  const GoogleCalendarIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="#fff"/>
      <path fill="#4285F4" d="M18 5H6a1 1 0 00-1 1v2h14V6a1 1 0 00-1-1z"/>
      <path fill="#34A853" d="M5 8h14v5H5z" opacity="0.8"/>
      <path fill="#FBBC04" d="M5 13h7v5H6a1 1 0 01-1-1v-4z" opacity="0.8"/>
      <path fill="#EA4335" d="M12 13h7v4a1 1 0 01-1 1h-6v-5z" opacity="0.8"/>
      <text x="12" y="16" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1a73e8">
        {format(date, 'd')}
      </text>
    </svg>
  )

  return (
    <div className="mt-4">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-semibold shadow-lg animate-fade-in">
          {showToast}
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowCopyModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">Copy Shift Info</h3>
              <button 
                onClick={() => setShowCopyModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="p-4">
              <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                {/* Date */}
                <p className="text-amber-400 text-xs font-medium mb-1">📅 {format(date, 'EEEE, MMMM d, yyyy')}</p>
                
                {/* Shift */}
                <div className="flex items-center gap-2 my-3">
                  <span className="text-3xl">{shiftInfo.emoji}</span>
                  <span className="text-lg font-bold text-white">{shiftInfo.label}</span>
                </div>
                
                {/* Timing */}
                {!isOff && shiftInfo.timing && (
                  <p className="text-amber-300/80 text-sm">⏰ {shiftInfo.timing}</p>
                )}
                
                {/* Branding */}
                <p className="text-zinc-500 text-xs mt-3 pt-3 border-t border-zinc-700/50">
                  🌻 Snehaa's Shift Roster
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-4 pb-4">
              <button
                onClick={handleCopy}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={closeShareModal}
        >
          <div 
            className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">Share Shift Card</h3>
              <button 
                onClick={closeShareModal}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Image Preview */}
            <div className="p-4">
              <div className="rounded-xl overflow-hidden bg-zinc-800 aspect-[3/2] flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-400 text-xs">Generating image...</span>
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Shift card" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-zinc-500 text-sm">Failed to generate</span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!imageUrl}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>⬇️</span>
                <span>Download</span>
              </button>
              <button
                onClick={handleShare}
                disabled={!imageUrl}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Actions Bar */}
      <div className="p-3 rounded-2xl surface-1 border border-zinc-800">
        <div className="flex items-center justify-center gap-3">
          {/* Copy */}
          <button
            onClick={handleCopyClick}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all active:scale-95"
          >
            <span className="text-xl">📋</span>
            <span className="text-[11px] font-medium text-zinc-400">Copy</span>
          </button>

          {/* Share Image */}
          <button
            onClick={handleShareClick}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 hover:from-amber-500/30 hover:to-orange-500/20 border border-amber-500/30 transition-all active:scale-95"
          >
            <span className="text-xl">🖼️</span>
            <span className="text-[11px] font-medium text-amber-300">Share</span>
          </button>

          {/* Google Calendar */}
          <button
            onClick={handleGoogleCalendar}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all active:scale-95"
          >
            <GoogleCalendarIcon />
            <span className="text-[11px] font-medium text-zinc-400">Calendar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Week Ahead Preview Component
function WeekAheadPreview({ currentDate, roasterData }) {
  const today = getIndianDate()
  const weekDays = []
  
  // Get next 7 days starting from today
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, i)
    const dateKey = format(day, 'yyyy-MM-dd')
    const dayData = roasterData?.[dateKey]
    const shift = dayData?.userA
    const shiftInfo = getShiftInfo(shift)
    const isCurrentDay = isSameDay(day, currentDate)
    const isToday = i === 0
    
    weekDays.push({
      date: day,
      dateKey,
      shift,
      shiftInfo,
      isCurrentDay,
      isToday
    })
  }

  return (
    <div className="p-4 rounded-2xl surface-1 border border-zinc-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📅</span>
        <h4 className="text-sm font-semibold text-zinc-200">Week Ahead</h4>
      </div>
      
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {weekDays.map((day) => (
          <div 
            key={day.dateKey}
            className={`flex-shrink-0 w-12 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
              day.isCurrentDay 
                ? 'bg-amber-500/20 border border-amber-500/40 ring-1 ring-amber-500/20' 
                : 'bg-zinc-800/30 border border-zinc-700/30'
            }`}
          >
            <span className={`text-[10px] font-medium ${day.isToday ? 'text-amber-400' : 'text-zinc-500'}`}>
              {day.isToday ? 'Today' : format(day.date, 'EEE')}
            </span>
            <span className={`text-lg ${day.isCurrentDay ? '' : 'grayscale-[30%]'}`}>
              {day.shiftInfo?.emoji || '❓'}
            </span>
            <span className={`text-[10px] font-medium ${day.isCurrentDay ? 'text-amber-300' : 'text-zinc-400'}`}>
              {format(day.date, 'd')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Countdown to Next Off Component
function CountdownToOff({ roasterData }) {
  const today = getIndianDate()
  const offTypes = ['WO', 'L', 'EL', 'CO', 'H', 'SDO']
  
  // Look ahead up to 30 days for next off
  let nextOff = null
  let daysUntilOff = 0
  
  for (let i = 1; i <= 30; i++) {
    const checkDate = addDays(today, i)
    const dateKey = format(checkDate, 'yyyy-MM-dd')
    const dayData = roasterData?.[dateKey]
    const shift = dayData?.userA
    
    if (offTypes.includes(shift)) {
      nextOff = {
        date: checkDate,
        shift,
        shiftInfo: getShiftInfo(shift)
      }
      daysUntilOff = i
      break
    }
  }
  
  // Check if today is off
  const todayKey = format(today, 'yyyy-MM-dd')
  const todayShift = roasterData?.[todayKey]?.userA
  const isOffToday = offTypes.includes(todayShift)
  
  if (isOffToday) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-2xl">🎉</span>
          </div>
          <div>
            <p className="text-emerald-400 font-bold text-sm">It's your day off!</p>
            <p className="text-emerald-300/60 text-xs">Enjoy and relax! 💛</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!nextOff) {
    return (
      <div className="p-4 rounded-2xl surface-1 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center">
            <span className="text-2xl">💪</span>
          </div>
          <div>
            <p className="text-zinc-300 font-medium text-sm">Keep pushing!</p>
            <p className="text-zinc-500 text-xs">No off days in sight (30 days)</p>
          </div>
        </div>
      </div>
    )
  }

  // Motivational messages based on days remaining
  const getMessage = () => {
    if (daysUntilOff === 1) return "Almost there! Just one more day! 🌟"
    if (daysUntilOff === 2) return "You got this! 2 more days! 💪"
    if (daysUntilOff <= 3) return "Hang in there, sunshine! ☀️"
    if (daysUntilOff <= 5) return "Halfway through! Keep going! 🚀"
    return "Stay strong, you can do it! 💛"
  }

  const getEmoji = () => {
    if (daysUntilOff === 1) return "🏁"
    if (daysUntilOff === 2) return "✌️"
    if (daysUntilOff <= 3) return "🎯"
    if (daysUntilOff <= 5) return "⚡"
    return "🌻"
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center relative">
          <span className="text-3xl font-bold text-amber-400">{daysUntilOff}</span>
          <span className="absolute -top-1 -right-1 text-lg">{getEmoji()}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-amber-300 font-bold text-sm">
              {daysUntilOff === 1 ? 'day' : 'days'} until {nextOff.shiftInfo.label}
            </p>
            <span className="text-lg">{nextOff.shiftInfo.emoji}</span>
          </div>
          <p className="text-amber-400/60 text-xs mt-0.5">{getMessage()}</p>
          <p className="text-zinc-500 text-[10px] mt-1">{format(nextOff.date, 'EEEE, MMM d')}</p>
        </div>
      </div>
    </div>
  )
}

// Shift Statistics Component
function ShiftStatistics({ roasterData, daysInMonth }) {
  const [expanded, setExpanded] = useState(false)
  
  // Calculate stats
  const stats = {
    morning: 0,
    afternoon: 0,
    night: 0,
    general: 0,
    us: 0,
    weekOff: 0,
    leave: 0,
    holiday: 0,
    total: daysInMonth?.length || 0
  }
  
  if (roasterData && daysInMonth) {
    daysInMonth.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const shift = roasterData[dateKey]?.userA
      
      switch(shift) {
        case 'M': stats.morning++; break
        case 'A': stats.afternoon++; break
        case 'N': stats.night++; break
        case 'STS': stats.general++; break
        case 'US1': stats.us++; break
        case 'WO': stats.weekOff++; break
        case 'L': case 'EL': case 'CO': stats.leave++; break
        case 'H': case 'SDO': stats.holiday++; break
      }
    })
  }
  
  const workDays = stats.morning + stats.afternoon + stats.night + stats.general + stats.us
  const offDays = stats.weekOff + stats.leave + stats.holiday

  const statItems = [
    { label: 'Morning', value: stats.morning, emoji: '🌅', color: 'text-orange-400' },
    { label: 'Afternoon', value: stats.afternoon, emoji: '☀️', color: 'text-yellow-400' },
    { label: 'Night', value: stats.night, emoji: '🌙', color: 'text-indigo-400' },
    { label: 'General', value: stats.general, emoji: '💼', color: 'text-amber-400' },
    { label: 'US Shift', value: stats.us, emoji: '🇺🇸', color: 'text-blue-400' },
    { label: 'Week Off', value: stats.weekOff, emoji: '😴', color: 'text-emerald-400' },
    { label: 'Leave', value: stats.leave, emoji: '🏖️', color: 'text-violet-400' },
    { label: 'Holiday', value: stats.holiday, emoji: '🎉', color: 'text-pink-400' },
  ]

  return (
    <div className="p-4 rounded-2xl surface-1 border border-zinc-800">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h4 className="text-sm font-semibold text-zinc-200">Monthly Stats</h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-400 font-bold">{workDays}</span>
            <span className="text-zinc-600">work</span>
            <span className="text-zinc-700">•</span>
            <span className="text-emerald-400 font-bold">{offDays}</span>
            <span className="text-zinc-600">off</span>
          </div>
          <svg 
            className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-4 gap-2">
          {statItems.map(item => (
            item.value > 0 && (
              <div 
                key={item.label}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-800/30"
              >
                <span className="text-lg">{item.emoji}</span>
                <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                <span className="text-[9px] text-zinc-500 text-center leading-tight">{item.label}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

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
        greeting: 'Rest Day Vibes!',
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

function DailyView({ date, dayData, onPrev, onNext, hasPrev, hasNext, currentIndex, totalDays, userNames = { userA: 'Snehaa 🌻' }, roasterData, daysInMonth }) {
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
                      {shift === 'SDO' && '⭐ Special day, enjoy it!'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cab Booking Reminder - For work shifts */}
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
                  
                  {/* Cab Status - Always show timing */}
                  <div className="space-y-2 text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Cab for:</span>
                      <span className="text-amber-200 font-semibold">{shiftInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Timing:</span>
                      <span className="text-amber-200 font-semibold">{shiftInfo.timing}</span>
                    </div>
                    {!isWeekend && reminder && (
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Book by:</span>
                        <span className="text-amber-400 font-bold">{reminder.bookBy}</span>
                        {reminder.isMonday && <span className="text-orange-400 text-[10px]">🚨 Friday!</span>}
                      </div>
                    )}
                  </div>
                  
                  {/* Weekend Warning */}
                  {isWeekend && (
                    <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-3">
                      <p className="text-[11px] text-orange-300 text-center font-medium">
                        ⚠️ Cab booking not available on weekends!
                      </p>
                      <p className="text-[10px] text-orange-400/70 text-center mt-1">
                        Book your {shiftInfo.label.toLowerCase()} cab on Friday 📅
                      </p>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-amber-400/50 text-center italic">
                    💛 Don't forget to book... unless you've got Ola/Uber money 💸 💛
                  </p>
                </div>
              )
            })()}

            {/* Cab Status for Off Days */}
            {isOffDay && (
              <div className="p-4 rounded-2xl surface-1 border border-zinc-700/50 bg-zinc-800/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚖</span>
                    <h4 className="text-sm font-bold text-zinc-400 font-display">Routematic Cab</h4>
                  </div>
                  <a 
                    href="#"
                    className="px-2.5 py-1 rounded-lg bg-zinc-700/50 text-zinc-400 text-xs flex items-center gap-1"
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
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[11px] text-emerald-300 text-center font-medium">
                    {shift === 'WO' && '😴 Week off! No cab needed today'}
                    {shift === 'L' && '🏖️ On leave! No cab required'}
                    {shift === 'EL' && '🏠 Emergency leave - no cab needed'}
                    {shift === 'CO' && '🎁 Comp off day! No cab required'}
                    {shift === 'H' && '🎉 Holiday! No cab needed'}
                    {shift === 'SDO' && '⭐ Special day off! No cab required'}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-500 text-center mt-2 italic">
                  Enjoy your day off! 💛
                </p>
              </div>
            )}

            {/* Quick Actions - Share, Calendar, Copy */}
            <QuickActions 
              date={date} 
              shift={shift} 
              shiftInfo={shiftInfo}
            />

            {/* Week Ahead Preview */}
            {roasterData && (
              <WeekAheadPreview 
                currentDate={date}
                roasterData={roasterData}
              />
            )}

            {/* Countdown to Next Off - Only show on today */}
            {roasterData && isSameDay(date, getIndianDate()) && (
              <CountdownToOff roasterData={roasterData} />
            )}

            {/* Monthly Statistics */}
            {roasterData && daysInMonth && (
              <ShiftStatistics 
                roasterData={roasterData}
                daysInMonth={daysInMonth}
              />
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
