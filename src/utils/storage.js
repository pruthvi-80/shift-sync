// Month name mapping for JSON files
const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// Fetch roaster data from JSON file for a specific month
export async function fetchRoasterForMonth(year, month) {
  try {
    const monthName = MONTH_NAMES[month] // month is 0-indexed
    const response = await fetch(`/roasters/${year}/${monthName}.json`)
    
    if (!response.ok) {
      console.log(`No roaster found for ${monthName} ${year}`)
      return null
    }
    
    const data = await response.json()
    return convertToRoasterFormat(data, year, month)
  } catch (error) {
    console.error('Error fetching roaster:', error)
    return null
  }
}

// Fetch Snehaa's shift for today (for splash greeting)
export async function fetchTodayShift() {
  try {
    const now = new Date()
    const indianTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const year = indianTime.getFullYear()
    const month = indianTime.getMonth()
    const day = indianTime.getDate()
    
    const monthName = MONTH_NAMES[month]
    const response = await fetch(`/roasters/${year}/${monthName}.json`)
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data.snehaa?.[String(day)] || null
  } catch (error) {
    console.error('Error fetching today shift:', error)
    return null
  }
}

// Convert JSON format to app's roaster format
// JSON: { "snehaa": { "1": "M", "2": "A" }, "partner": { "1": "A", "2": "M" } }
// App:  { "2026-08-01": { userA: "M", userB: "A" }, "2026-08-02": { userA: "A", userB: "M" } }
function convertToRoasterFormat(data, year, month) {
  const roaster = {}
  const snehaaShifts = data.snehaa || {}
  const partnerShifts = data.partner || {}
  
  // Get all days from both users
  const allDays = new Set([...Object.keys(snehaaShifts), ...Object.keys(partnerShifts)])
  
  allDays.forEach(day => {
    const dayNum = parseInt(day)
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    roaster[dateKey] = {
      userA: snehaaShifts[day] || null,
      userB: partnerShifts[day] || null
    }
  })
  
  return roaster
}

// Check which months have roaster data available
export async function getAvailableMonths(year) {
  const available = []
  for (let month = 0; month < 12; month++) {
    try {
      const monthName = MONTH_NAMES[month]
      const response = await fetch(`/roasters/${year}/${monthName}.json`, { method: 'HEAD' })
      if (response.ok) {
        available.push(month)
      }
    } catch (error) {
      // Month not available
    }
  }
  return available
}

