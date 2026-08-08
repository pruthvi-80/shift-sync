import { getShiftInfo, WORK_SHIFTS } from '../utils/shiftCodes'

function ShiftCard({ user, shift, isMatch, delay = 0, isUserA = true }) {
  const shiftInfo = getShiftInfo(shift)
  const isWorkShift = WORK_SHIFTS.includes(shift)

  // Get first letter of user name for avatar, or fallback to A/B
  const avatarLetter = user ? user.charAt(0).toUpperCase() : (isUserA ? '🌻' : 'P')

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 fade-in ${shiftInfo.bgClass} ${
        isMatch 
          ? 'gradient-border-animated match-glow' 
          : 'border border-zinc-800'
      } ${isUserA ? 'ring-2 ring-amber-400/30' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer effect for matches */}
      {isMatch && <div className="shimmer absolute inset-0 pointer-events-none" />}
      
      {/* Colored accent line based on shift - sunflower for Snehaa */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isUserA 
          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400' 
          : `bg-gradient-to-r ${shiftInfo.bgGradient}`
      }`} />
      
      <div className="relative flex items-center gap-4">
        {/* User Avatar */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
            isUserA 
              ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
              : 'bg-gradient-to-br from-zinc-600 to-zinc-700'
          }`}>
            {isUserA ? (
              <span className="text-3xl drop-shadow-md" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>🌻</span>
            ) : (
              <span className="text-lg font-bold text-white">{avatarLetter}</span>
            )}
          </div>
          {isMatch && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center pulse-scale">
              <span className="text-sm">💛</span>
            </div>
          )}
          {/* Extra glow for Snehaa */}
          {isUserA && (
            <div className="absolute inset-0 rounded-xl bg-amber-400/30 blur-lg -z-10" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg font-display tracking-tight ${
            isUserA ? 'text-amber-100' : 'text-zinc-300'
          }`}>
            {user}
            {isUserA && <span className="ml-1 text-xs text-amber-400/70">✨</span>}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r ${shiftInfo.bgGradient} text-white shadow-lg`}>
              <span className={`text-xl ${isMatch ? 'sparkle' : ''}`}>{shiftInfo.emoji}</span>
              <span className="font-display tracking-wide">{shift}</span>
            </span>
            <div className="flex flex-col">
              <span className={`text-sm font-medium truncate ${isUserA ? 'text-zinc-200' : 'text-zinc-400'}`}>{shiftInfo.label}</span>
              {isWorkShift && shiftInfo.timing && (
                <span className="text-zinc-500 text-xs">⏰ {shiftInfo.timing}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShiftCard
