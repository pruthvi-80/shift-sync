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

// Get cab booking reminder info (with duplicate prevention)
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
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const notification = new Notification('Shift Sync Test', {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    body: 'Notifications are working! ✅',
    tag: 'test-notification',
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

// Send shift notification
export function sendShiftNotification(shiftType, shiftTime) {
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

  const notification = new Notification(`${shiftEmoji[shiftType]} ${shiftNames[shiftType]} Shift Reminder`, {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    body: `Your shift starts at ${shiftTime}\n Don't forget your cab! 🚕`,
    tag: `shift-${new Date().toDateString()}`,
    requireInteraction: false,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

// Send cab booking reminder
export function sendCabBookingReminder(shiftType, bookBy) {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return
  }

  const notification = new Notification('📅 Book Your Cab', {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    body: `Tomorrow's shift. Book by ${bookBy}! 🚕`,
    tag: 'cab-reminder',
    requireInteraction: true,
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}
