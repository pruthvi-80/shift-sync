// Indian Standard Time utilities (UTC+5:30)

export function getIndianDate() {
  // Get current time in IST (Asia/Kolkata)
  const now = new Date()
  const indianTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return indianTime
}

export function getIndianDateString() {
  // Returns YYYY-MM-DD in IST
  const indianDate = getIndianDate()
  const year = indianDate.getFullYear()
  const month = String(indianDate.getMonth() + 1).padStart(2, '0')
  const day = String(indianDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isIndianToday(date) {
  // Check if a given date is today in IST
  const indianToday = getIndianDate()
  return (
    date.getFullYear() === indianToday.getFullYear() &&
    date.getMonth() === indianToday.getMonth() &&
    date.getDate() === indianToday.getDate()
  )
}

export function getIndianMonth() {
  // Get the start of current month in IST
  const indianDate = getIndianDate()
  return new Date(indianDate.getFullYear(), indianDate.getMonth(), 1)
}

export function getIndianHour() {
  // Get current hour in IST (0-23)
  const indianDate = getIndianDate()
  return indianDate.getHours()
}

export function getGreeting() {
  const hour = getIndianHour()
  
  // Late night / early morning (12 AM - 4 AM)
  if (hour >= 0 && hour < 4) {
    const messages = [
      { text: "Sweet Dreams 🌙", subtitle: "Rest well, my sunflower!" },
      { text: "Counting Stars 💫", subtitle: "Think of me in your dreams" },
      { text: "Night Night 🌻", subtitle: "Sleep tight, beautiful!" }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Early morning (4 AM - 6 AM)
  if (hour >= 4 && hour < 6) {
    return { text: "Early Sunshine! 🌅", subtitle: "You're up before the flowers!" }
  }
  
  // Morning (6 AM - 12 PM)
  if (hour >= 6 && hour < 12) {
    const messages = [
      { text: "Good Morning! 🌻", subtitle: "Bloom bright today, sunshine!" },
      { text: "Rise & Shine! ☀️", subtitle: "My sunflower is awake!" },
      { text: "Morning, Beautiful! 🌼", subtitle: "Time to spread happiness!" }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Afternoon (12 PM - 5 PM)
  if (hour >= 12 && hour < 17) {
    const messages = [
      { text: "Hello Sunshine! ☀️", subtitle: "Keep glowing like a sunflower!" },
      { text: "Hey Beautiful! 🌻", subtitle: "Hope your day is blooming!" },
      { text: "Afternoon Glow! 🌼", subtitle: "You make everything brighter!" }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Evening (5 PM - 9 PM)
  if (hour >= 17 && hour < 21) {
    const messages = [
      { text: "Golden Hour! 🌅", subtitle: "As beautiful as sunset!" },
      { text: "Evening, Love! 🌻", subtitle: "Time to unwind, sunshine!" },
      { text: "Twilight Magic! ✨", subtitle: "You're the brightest flower!" }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Night (9 PM - 12 AM)
  const messages = [
    { text: "Good Night! 🌙", subtitle: "Dream of sunflower fields!" },
    { text: "Starry Night! ⭐", subtitle: "You shine even at night!" },
    { text: "Sweet Dreams! 💛", subtitle: "Sleep well, my sunflower!" }
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}
