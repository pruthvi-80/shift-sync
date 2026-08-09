import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { getShiftInfo, doShiftsMatch, SHIFT_CODES } from '../utils/shiftCodes'
import { isIndianToday } from '../utils/indianTime'

function MonthlyOverview({ selectedMonth, roasterData, onDaySelect, currentDayIndex }) {
  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  }), [selectedMonth])

  // Calculate first day offset (0 = Sunday)
  const firstDayOffset = getDay(startOfMonth(selectedMonth))

  // Calculate stats
  const stats = useMemo(() => {
    let matching = 0
    let total = 0

    daysInMonth.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      const dayData = roasterData[key]
      if (dayData && dayData.userA && dayData.userB) {
        total++
        if (doShiftsMatch(dayData.userA, dayData.userB)) {
          matching++
        }
      }
    })

    return { matching, total, percentage: total > 0 ? Math.round((matching / total) * 100) : 0 }
  }, [daysInMonth, roasterData])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Stats Summary */}
        <div className="mb-5 p-4 rounded-2xl surface-1 border border-amber-900/30">
          <h3 className="text-xs font-bold text-amber-400/70 mb-4 uppercase tracking-widest font-display flex items-center gap-2">
            <span>🌻</span> Monthly Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-xl surface-2 border border-amber-500/20">
              <div className="text-3xl font-bold text-amber-400 font-display">{stats.matching}</div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-1 tracking-wide">TOGETHER 💛</div>
            </div>
            <div className="text-center p-4 rounded-xl surface-2">
              <div className="text-3xl font-bold text-white font-display">{stats.total}</div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-1 tracking-wide">TOTAL</div>
            </div>
            <div className="text-center p-4 rounded-xl surface-2 border border-amber-500/20">
              <div className="text-3xl font-bold text-amber-300 font-display">{stats.percentage}%</div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-1 tracking-wide">BLOOM RATE</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full sunflower-gradient transition-all duration-500 rounded-full"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <p className="text-xs text-center text-amber-400/50 mt-2">
            {stats.matching > 0 ? `${stats.matching} beautiful days together in ${format(selectedMonth, 'MMMM')}! 🌼` : 'Add shifts to see your bloom rate!'}
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl surface-1 border border-amber-900/20 p-4">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] font-medium text-amber-400/50 py-1 uppercase tracking-wider">
                {day.charAt(0)}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {daysInMonth.map((day, index) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayData = roasterData[key]
              const isMatching = dayData && doShiftsMatch(dayData.userA, dayData.userB)
              const hasData = dayData && dayData.userA && dayData.userB
              const isCurrentDay = isIndianToday(day)
              const isSelected = index === currentDayIndex

              return (
                <button
                  key={key}
                  onClick={() => onDaySelect(index)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${
                    isSelected
                      ? 'ring-1 ring-amber-400 ring-offset-1 ring-offset-[#09090b]'
                      : ''
                  } ${
                    isMatching
                      ? 'surface-2 border border-amber-400/40 text-amber-300 hover:bg-amber-500/10'
                      : hasData
                        ? 'surface-2 hover:bg-zinc-700/50 text-zinc-300'
                        : 'text-zinc-600 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`font-medium ${isCurrentDay ? 'text-amber-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasData && (
                    <div className="flex gap-0.5 mt-0.5">
                      <div 
                        className={`w-1.5 h-1.5 rounded-full ${getShiftInfo(dayData.userA).color}`}
                        title={`Snehaa: ${dayData.userA}`}
                      />
                      <div 
                        className={`w-1.5 h-1.5 rounded-full ${getShiftInfo(dayData.userB).color}`}
                        title={`Partner: ${dayData.userB}`}
                      />
                    </div>
                  )}
                  
                  {isMatching && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-[8px]">🌻</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 rounded-xl surface-1 border border-amber-900/20">
          <h4 className="text-xs font-semibold text-amber-400/70 mb-3 uppercase tracking-wider">Shift Codes</h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(SHIFT_CODES).map(code => {
              const info = getShiftInfo(code)
              return (
                <div key={code} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg surface-2">
                  <span className="text-sm">{info.emoji}</span>
                  <div className={`w-2 h-2 rounded-full ${info.color}`} />
                  <span className="text-zinc-400 text-[10px] font-medium">{code}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyOverview
