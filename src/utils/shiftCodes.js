// Shift code definitions and colors
export const SHIFT_CODES = {
  M: { label: 'Morning', timing: '6:30 AM - 2:30 PM', color: 'bg-yellow-400', textColor: 'text-yellow-400', emoji: '🌅', bgGradient: 'from-yellow-400 to-yellow-500', bgClass: 'bg-yellow-500/10' },
  A: { label: 'Afternoon', timing: '2:30 PM - 11:00 PM', color: 'bg-amber-600', textColor: 'text-amber-500', emoji: '☀️', bgGradient: 'from-amber-500 to-amber-600', bgClass: 'bg-amber-500/10' },
  N: { label: 'Night', timing: '10:30 PM - 7:00 AM', color: 'bg-zinc-500', textColor: 'text-zinc-400', emoji: '🌙', bgGradient: 'from-zinc-500 to-zinc-600', bgClass: 'bg-zinc-500/10' },
  STS: { label: 'General', timing: '12:00 PM - 9:00 PM', color: 'bg-orange-200', textColor: 'text-orange-300', emoji: '💼', bgGradient: 'from-orange-200 to-orange-300', bgClass: 'bg-orange-200/10' },
  US1: { label: 'US Shift', timing: '5:30 PM - 2:30 AM', color: 'bg-blue-500', textColor: 'text-blue-400', emoji: '🇺🇸', bgGradient: 'from-blue-500 to-blue-600', bgClass: 'bg-blue-500/10' },
  L: { label: 'Leave', timing: null, color: 'bg-violet-500', textColor: 'text-violet-400', emoji: '🏖️', bgGradient: 'from-violet-500 to-violet-600', bgClass: 'bg-violet-500/10' },
  EL: { label: 'Emergency Leave', timing: null, color: 'bg-red-500', textColor: 'text-red-400', emoji: '🚨', bgGradient: 'from-red-500 to-red-600', bgClass: 'bg-red-500/10' },
  WO: { label: 'Week Off', timing: null, color: 'bg-emerald-400', textColor: 'text-emerald-400', emoji: '😴', bgGradient: 'from-emerald-400 to-emerald-500', bgClass: 'bg-emerald-400/10' },
  CO: { label: 'Comp Off', timing: null, color: 'bg-indigo-500', textColor: 'text-indigo-400', emoji: '🎁', bgGradient: 'from-indigo-500 to-indigo-600', bgClass: 'bg-indigo-500/10' },
  H: { label: 'Holiday', timing: null, color: 'bg-sky-300', textColor: 'text-sky-300', emoji: '🎉', bgGradient: 'from-sky-300 to-sky-400', bgClass: 'bg-sky-300/10' },
  SDO: { label: 'Special Day Off', timing: null, color: 'bg-orange-500', textColor: 'text-orange-400', emoji: '⭐', bgGradient: 'from-orange-500 to-orange-600', bgClass: 'bg-orange-500/10' }
}

// Work shifts that need cab booking
export const WORK_SHIFTS = ['M', 'A', 'N', 'STS', 'US1']

export const SHIFT_CODE_OPTIONS = Object.keys(SHIFT_CODES)

export function getShiftInfo(code) {
  return SHIFT_CODES[code] || { label: 'Unknown', color: 'bg-zinc-700', textColor: 'text-zinc-500', emoji: '❓', bgGradient: 'from-zinc-600 to-zinc-700', bgClass: 'bg-zinc-500/10' }
}

export function doShiftsMatch(shiftA, shiftB) {
  if (!shiftA || !shiftB) return false
  return shiftA === shiftB
}

export function getMatchStatus(shiftA, shiftB) {
  if (!shiftA || !shiftB) return { match: false, type: 'missing' }
  
  if (shiftA === shiftB) {
    // Both same
    const leaveTypes = ['L', 'EL', 'CO']
    const offTypes = ['WO', 'H', 'SDO']
    
    if (leaveTypes.includes(shiftA)) return { match: true, type: 'leave' }
    if (offTypes.includes(shiftA)) return { match: true, type: 'weekoff' }
    return { match: true, type: 'work' }
  }
  
  return { match: false, type: 'different' }
}
