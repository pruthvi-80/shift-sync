// Service Worker for background notifications

const CACHE_NAME = 'shift-sync-v1'

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(clients.claim())
})

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip Chrome extensions
  if (event.request.url.includes('chrome-extension://')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Return cached version on network failure
        return caches.match(event.request)
      })
  )
})

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-shifts') {
    event.waitUntil(checkUpcomingShifts())
  }
})

// Check for upcoming shifts
async function checkUpcomingShifts() {
  try {
    // This would be called periodically or on demand
    console.log('Checking for upcoming shifts...')
    // The actual logic would be handled by the main app
  } catch (error) {
    console.error('Error checking shifts:', error)
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus the app window if open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if app isn't open
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag)
})
