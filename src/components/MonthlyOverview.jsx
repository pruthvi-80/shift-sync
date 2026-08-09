import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { getShiftInfo, SHIFT_CODES, WORK_SHIFTS } from '../utils/shiftCodes'
import { isIndianToday } from '../utils/indianTime'

function MonthlyOverview({ selectedMonth, roasterData, onDaySelect, currentDayIndex }) {
  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  }), [selectedMonth])

  // Calculate first day offset (0 = Sunday)
  const firstDayOffset = getDay(startOfMonth(selectedMonth))

  // Calculate Snehaa's shift stats
  const stats = useMemo(() => {
    const shiftCounts = {}
    let workDays = 0
    let offDays = 0
    let totalDays = 0

    daysInMonth.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      const dayData = roasterData[key]
      if (dayData && dayData.userA) {
        totalDays++
        const shift = dayData.userA
        shiftCounts[shift] = (shiftCounts[shift] || 0) + 1
        
        if (WORK_SHIFTS.includes(shift)) {
          workDays++
        } else {
          offDays++
        }
      }
    })

    return { shiftCounts, workDays, offDays, totalDays }
  }, [daysInMonth, roasterData])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get top shifts for summary
  const topShifts = Object.entries(stats.shiftCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Stats Summary */}
        <div className="mb-5 p-4 rounded-2xl surface-1 border border-amber-900/30">
          <h3 className="text-xs font-bold text-amber-400/70 mb-4 uppercase tracking-widest font-display flex items-center gap-2">
            <span>🌻</span> Snehaa's {format(selectedMonth, 'MMMM')}
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-4 rounded-xl surface-2 border border-amber-500/20">
              <div className="text-3xl font-bold text-amber-400 font-display">{stats.workDays}</div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-1 tracking-wide">WORK DAYS</div>
            </div>
            <div className="text-center p-4 rounded-xl surface-2 border border-emerald-500/20">
              <div className="text-3xl font-bold text-emerald-400 font-display">{stats.offDays}</div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-1 tracking-wide">OFF DAYS</div>
            </div>
            <div className="text-center p-4 rounded-xl surface-2">
              <div className="text-3xl font-bold text-white font-display">{stats.totalDays}</div>
              <div className="text-[10px] text-zinc-500 font-semibold mt-1 tracking-wide">TOTAL</div>
            </div>
          </div>

          {/* Shift Breakdown */}
          {topShifts.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {topShifts.map(([shift, count]) => {
                const info = getShiftInfo(shift)
                return (
                  <div 
                    key={shift} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${info.bgClass} border border-white/5`}
                  >
                    <span className="text-lg">{info.emoji}</span>
                    <span className={`text-sm font-bold ${info.textColor}`}>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
          
          <p className="text-xs text-center text-amber-400/50 mt-4">
            {stats.offDays > 0 
              ? `${stats.offDays} days to recharge those sunflower batteries! 🌻` 
              : 'Add shifts to see the summary!'}
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
              const shift = dayData?.userA
              const hasData = !!shift
              const isCurrentDay = isIndianToday(day)
              const isSelected = index === currentDayIndex
              const shiftInfo = hasData ? getShiftInfo(shift) : null
              const isOffDay = hasData && ['WO', 'L', 'EL', 'CO', 'H', 'SDO'].includes(shift)

              return (
                <button
                  key={key}
                  onClick={() => onDaySelect(index)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${
                    isSelected
                      ? 'ring-1 ring-amber-400 ring-offset-1 ring-offset-[#09090b]'
                      : ''
                  } ${
                    isOffDay
                      ? 'surface-2 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10'
                      : hasData
                        ? 'surface-2 hover:bg-zinc-700/50 text-zinc-300'
                        : 'text-zinc-600 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`font-medium ${isCurrentDay ? 'text-amber-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasData && (
                    <div className="mt-0.5">
                      <div 
                        className={`w-2 h-2 rounded-full ${shiftInfo.color}`}
                        title={`${shiftInfo.label}`}
                      />
                    </div>
                  )}
                  
                  {isOffDay && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="text-[8px]">🎉</span>
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
