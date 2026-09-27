import { useState, useEffect } from 'react'
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  sendTestNotification,
  DEFAULT_NOTIFICATION_PREFS,
} from '../utils/notifications'

function NotificationSettings() {
  const [prefs, setPrefs] = useState(DEFAULT_NOTIFICATION_PREFS)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [testMessage, setTestMessage] = useState('')

  // Load preferences on mount
  useEffect(() => {
    const savedPrefs = getNotificationPreferences()
    setPrefs(savedPrefs)
    
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  // Request notification permission
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setPermissionGranted(granted)
    if (granted) {
      saveNotificationPreferences(prefs)
      // Add a slight delay to ensure permission is properly set
      setTimeout(() => {
        const status = 'Notification' in window ? Notification.permission : 'denied'
        setPermissionGranted(status === 'granted')
      }, 100)
    }
  }

  // Update preference
  const updatePref = (key, value) => {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    saveNotificationPreferences(updated)
  }

  // Test notification
  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      setTestMessage('⚠️ Notifications not supported')
      setTimeout(() => setTestMessage(''), 3000)
      return
    }

    // Request permission if not granted
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission()
      if (!granted) {
        setTestMessage('⚠️ Please enable notifications first')
        setTimeout(() => setTestMessage(''), 3000)
        return
      }
      setPermissionGranted(true)
    }

    setTestMessage('📤 Sending test notification...')
    sendTestNotification()
    setTimeout(() => {
      setTestMessage('✅ Notification sent! Check your desktop/mobile')
      setTimeout(() => setTestMessage(''), 4000)
    }, 500)
  }

  if (!showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full p-3 shadow-lg transition"
        title="Notification Settings"
      >
        🔔
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Notification Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Permission Status */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          {permissionGranted || (Notification?.permission === 'granted') ? (
            <p className="text-green-400 text-sm">✅ Notifications Enabled</p>
          ) : (
            <>
              <p className="text-yellow-400 text-sm mb-2">⚠️ Notifications Disabled</p>
              <button
                onClick={handleRequestPermission}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition"
              >
                Enable Notifications
              </button>
            </>
          )}
        </div>

        {permissionGranted && (
          <>
            {/* Main Toggle */}
            <div className="mb-4 space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.enabled}
                  onChange={(e) => updatePref('enabled', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="ml-3 text-white text-sm">Enable All Notifications</span>
              </label>

              {prefs.enabled && (
                <>
                  {/* Shift Notifications */}
                  <label className="flex items-center cursor-pointer pl-6">
                    <input
                      type="checkbox"
                      checked={prefs.shiftNotifications}
                      onChange={(e) => updatePref('shiftNotifications', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="ml-3 text-white text-sm">Shift Reminders</span>
                  </label>

                  {/* Cab Reminders */}
                  <label className="flex items-center cursor-pointer pl-6">
                    <input
                      type="checkbox"
                      checked={prefs.cabReminders}
                      onChange={(e) => updatePref('cabReminders', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="ml-3 text-white text-sm">Cab Booking Reminders</span>
                  </label>

                  {/* Notify Before */}
                  <div className="pl-6 flex items-center gap-2">
                    <label className="text-white text-sm">Notify before:</label>
                    <select
                      value={prefs.notifyBefore}
                      onChange={(e) => updatePref('notifyBefore', Number(e.target.value))}
                      className="bg-gray-800 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Shift Times (for reference) */}
            {prefs.enabled && prefs.shiftNotifications && (
              <div className="mb-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
                <p>🌅 Morning: {prefs.morningShiftTime}</p>
                <p>🌞 Afternoon: {prefs.afternoonShiftTime}</p>
                <p>🌙 Night: {prefs.nightShiftTime}</p>
              </div>
            )}

            {/* Test Notification */}
            <button
              onClick={handleTestNotification}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition mb-3"
            >
              Send Test Notification 🧪
            </button>
            
            {/* Test Message Feedback */}
            {testMessage && (
              <div className="mb-3 p-2 bg-blue-600/30 rounded text-center text-sm text-blue-200">
                {testMessage}
              </div>
            )}
          </>
        )}

        <button
          onClick={() => {
            setShowSettings(false)
            setTestMessage('')
          }}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings
