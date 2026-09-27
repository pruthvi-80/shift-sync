import { useState, useEffect } from 'react'
import {
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notifications'

function NotificationSettings() {
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [testMessage, setTestMessage] = useState('')

  // Check permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  // Request notification permission
  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setPermissionGranted(true)
      // Auto close settings after enabling
      setTimeout(() => {
        setShowSettings(false)
      }, 500)
    }
  }

  // Test notification
  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      setTestMessage('⚠️ Notifications not supported')
      setTimeout(() => setTestMessage(''), 3000)
      return
    }

    if (Notification.permission !== 'granted') {
      setTestMessage('⚠️ Please enable notifications first')
      setTimeout(() => setTestMessage(''), 3000)
      return
    }

    setTestMessage('📤 Sending test notification...')
    sendTestNotification()
    setTimeout(() => {
      setTestMessage('✅ Notification sent! Check your desktop/mobile')
      setTimeout(() => setTestMessage(''), 4000)
    }, 500)
  }

  // Button state - show enabled icon if permission granted, bell if not
  if (!showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className={`fixed bottom-6 right-6 rounded-full p-3 shadow-lg transition ${
          permissionGranted || (Notification?.permission === 'granted')
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-yellow-400 hover:bg-yellow-500'
        } text-white`}
        title={
          permissionGranted || (Notification?.permission === 'granted')
            ? 'Notifications Enabled'
            : 'Enable Notifications'
        }
      >
        {permissionGranted || (Notification?.permission === 'granted') ? '✅' : '🔔'}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Permission Status */}
        {permissionGranted || (Notification?.permission === 'granted') ? (
          <>
            <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded">
              <p className="text-green-400 text-sm font-semibold">✅ Notifications Enabled</p>
              <p className="text-green-300/70 text-xs mt-2">
                You'll receive shift reminders and cab booking alerts
              </p>
            </div>

            {/* Test Notification Button */}
            <button
              onClick={handleTestNotification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition mb-3"
            >
              Send Test Notification 🧪
            </button>

            {/* Test Message Feedback */}
            {testMessage && (
              <div className="mb-3 p-3 bg-blue-600/30 rounded text-center text-sm text-blue-200">
                {testMessage}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded">
              <p className="text-yellow-400 text-sm font-semibold">📬 Notifications Disabled</p>
              <p className="text-yellow-300/70 text-xs mt-2">
                Enable notifications to receive shift reminders and cab booking alerts
              </p>
            </div>

            <button
              onClick={handleEnableNotifications}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition"
            >
              Enable Notifications
            </button>
          </>
        )}

        <button
          onClick={() => setShowSettings(false)}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings
