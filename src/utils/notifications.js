// Notification preferences and utilities
import { getIndianDate } from './indianTime'

const NOTIFICATION_PREFS_KEY = 'shift_notification_prefs'

// Default notification settings
export const DEFAULT_NOTIFICATION_PREFS = {
  enabled: true,
  shiftNotifications: true,
  cabReminders: true,
  morningShiftTime: '08:00', // M shift at 8 AM
  afternoonShiftTime: '14:00', // A shift at 2 PM
  nightShiftTime: '23:00', // N shift at 11 PM
  notifyBefore: 60, // minutes before shift
}

// Get notification preferences
export function getNotificationPreferences() {
  try {
    const saved = localStorage.getItem(NOTIFICATION_PREFS_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATION_PREFS
  } catch {
    return DEFAULT_NOTIFICATION_PREFS
  }
}

// Save notification preferences
export function saveNotificationPreferences(prefs) {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

// Get shift start time based on shift type
export function getShiftStartTime(shiftType) {
  const prefs = getNotificationPreferences()
  
  const shiftTimes = {
    'M': prefs.morningShiftTime,
    'A': prefs.afternoonShiftTime,
    'N': prefs.nightShiftTime,
  }
  
  return shiftTimes[shiftType] || null
}

// Check if notification should be sent (with duplicate prevention)
export function shouldSendNotification(todayShift) {
  const prefs = getNotificationPreferences()
  
  if (!prefs.enabled || !prefs.shiftNotifications) return false
  
  // Check if notification was already sent today
  const lastNotificationKey = 'last_notification_sent'
  const lastSent = localStorage.getItem(lastNotificationKey)
  const today = new Date().toDateString()
  
  if (lastSent === today) {
    return false // Already sent notification today
  }
  
  // If today has a shift and it's close to start time
  if (todayShift && ['M', 'A', 'N'].includes(todayShift)) {
    const shiftTime = getShiftStartTime(todayShift)
    if (shiftTime) {
      const now = new Date()
      const [hours, mins] = shiftTime.split(':').map(Number)
      const shiftDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins)
      const timeDiff = (shiftDate - now) / (1000 * 60) // minutes
      
      // Mark notification as sent if timing is right
      if (timeDiff > 0 && timeDiff <= prefs.notifyBefore) {
        localStorage.setItem(lastNotificationKey, today)
        return true
      }
    }
  }
  
  return false
}

// Get cab reminders for today (send if tomorrow has a shift - 1 day prior)
// Returns array of shift reminders with dates
export function getCabRemindersForToday(roasterData) {
  const prefs = getNotificationPreferences()
  
  if (!prefs.enabled || !prefs.cabReminders) return []
  
  // Check if cab reminder was already sent today
  const lastCabReminderKey = 'last_cab_reminder_sent'
  const lastSent = localStorage.getItem(lastCabReminderKey)
  const today = new Date().toDateString()
  
  if (lastSent === today) {
    return [] // Already sent cab reminders today
  }

  const today_date = new Date()
  const tomorrow = addDays(today_date, 1)
  const tomorrowKey = getDateKey(tomorrow)

  const reminders = []

  // Check if tomorrow has a shift (M/A/N)
  // If yes, send cab booking reminder TODAY (1 day prior)
  const tomorrowShift = roasterData[tomorrowKey]?.userA

  if (tomorrowShift && ['M', 'A', 'N'].includes(tomorrowShift)) {
    // Skip if tomorrow is WO
    if (tomorrowShift === 'WO') {
      return []
    }

    const tomorrowFormatted = formatDateForDisplay(tomorrow)
    
    reminders.push({
      date: tomorrowFormatted,
      day: getDayName(tomorrow),
      shift: tomorrowShift,
      bookBy: 'Today by 6 PM',
    })
  }

  // Mark cab reminders as sent for today if there are any
  if (reminders.length > 0) {
    localStorage.setItem(lastCabReminderKey, today)
  }

  return reminders
}

// Helper: Get day name (Monday, Tuesday, etc.)
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

// Helper: Format date for display (e.g., "Sept 28")
function formatDateForDisplay(date) {
  const options = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

// Helper: Get date key in YYYY-MM-DD format
function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Add days to a date
function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// OLD: Get cab booking reminder info (with duplicate prevention)
export function shouldSendCabReminder() {
  const prefs = getNotificationPreferences()
  
  if (!prefs.enabled || !prefs.cabReminders) return false
  
  // Check if cab reminder was already sent today
  const lastCabReminderKey = 'last_cab_reminder_sent'
  const lastSent = localStorage.getItem(lastCabReminderKey)
  const today = new Date().toDateString()
  
  if (lastSent === today) {
    return false // Already sent cab reminder today
  }
  
  return true
}

// Mark cab reminder as sent
export function markCabReminderSent() {
  const today = new Date().toDateString()
  localStorage.setItem('last_cab_reminder_sent', today)
}

// Get cab booking reminder info
export function getCabBookingReminder(tomorrow, partnerShift) {
  const prefs = getNotificationPreferences()
  
  if (!prefs.enabled || !prefs.cabReminders) return null
  
  const dayOfWeek = tomorrow.getDay() // 0 = Sunday, 1 = Monday, ...
  
  // Only remind for Morning and Afternoon shifts on Mondays
  if (dayOfWeek === 1 && ['M', 'A'].includes(partnerShift)) {
    return {
      shift: partnerShift,
      day: 'Monday',
      bookBy: 'Friday 6 PM',
    }
  }
  
  // For other days, book by previous day 6 PM
  if (['M', 'A'].includes(partnerShift) && dayOfWeek !== 0) {
    return {
      shift: partnerShift,
      bookBy: 'By 6 PM',
    }
  }
  
  return null
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Send a test notification
export function sendTestNotification() {
  if (!('Notification' in window)) {
    console.error('Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted:', Notification.permission)
    return
  }

  try {
    // Try via Service Worker first (for PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Shift Sync Test ✅', {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          body: 'Notifications are working! 🎉',
          tag: 'test-notification',
          requireInteraction: false,
        })
      }).catch(err => {
        console.log('Service Worker notification failed, trying direct API:', err)
        // Fallback to direct notification
        triggerDirectNotification()
      })
    } else {
      // Fallback for non-PWA
      triggerDirectNotification()
    }
  } catch (error) {
    console.error('Error sending test notification:', error)
  }
}

function triggerDirectNotification() {
  const notification = new Notification('Shift Sync Test ✅', {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    body: 'Notifications are working! 🎉',
    tag: 'test-notification',
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

// Send shift notification
export function sendShiftNotification(shiftType, shiftTime) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const shiftNames = {
    'M': 'Morning',
    'A': 'Afternoon',
    'N': 'Night',
  }

  const shiftEmoji = {
    'M': '🌅',
    'A': '🌞',
    'N': '🌙',
  }

  const notificationOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    body: `Shift starts at ${shiftTime}\nDon't forget your cab! 🚕`,
    tag: `shift-${new Date().toDateString()}`,
    requireInteraction: false,
  }

  try {
    // Try via Service Worker first (for PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(
          `${shiftEmoji[shiftType]} ${shiftNames[shiftType]} Shift Reminder`,
          notificationOptions
        )
      }).catch(err => {
        console.log('Service Worker notification failed, trying direct:', err)
        triggerDirectShiftNotification(shiftEmoji[shiftType], shiftNames[shiftType], notificationOptions)
      })
    } else {
      triggerDirectShiftNotification(shiftEmoji[shiftType], shiftNames[shiftType], notificationOptions)
    }
  } catch (error) {
    console.error('Error sending shift notification:', error)
  }
}

function triggerDirectShiftNotification(emoji, shiftName, options) {
  const notification = new Notification(`${emoji} ${shiftName} Shift Reminder`, options)
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

// Send cab booking reminder with shift-specific message and DATE
export function sendCabBookingReminder(reminder) {
  if (!('Notification' in window)) {
    console.log('Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const shiftEmoji = {
    'M': '🌅',
    'A': '🌞',
    'N': '🌙',
  }

  const shiftName = {
    'M': 'Morning',
    'A': 'Afternoon',
    'N': 'Night',
  }

  const notificationOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    body: `${reminder.day}, ${reminder.date}\n${shiftEmoji[reminder.shift]} ${shiftName[reminder.shift]} shift\nBook by: ${reminder.bookBy} 🚕`,
    tag: `cab-reminder-${reminder.date}`,
    requireInteraction: true,
  }

  try {
    // Try via Service Worker first (for PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('📅 Book Your Cab', notificationOptions)
      }).catch(err => {
        console.log('Service Worker notification failed, trying direct:', err)
        triggerDirectCabNotification(notificationOptions)
      })
    } else {
      triggerDirectCabNotification(notificationOptions)
    }
  } catch (error) {
    console.error('Error sending cab reminder:', error)
  }
}

function triggerDirectCabNotification(options) {
  const notification = new Notification('📅 Book Your Cab', options)
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}
