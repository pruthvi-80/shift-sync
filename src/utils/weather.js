// Weather utility for Sunflower's PG location
// Location: 18.591872, 73.743290 (Snehaa's PG)

const LOCATION = {
  lat: 18.591872,
  lon: 73.743290,
  name: "Sunflower's PG 🌻"
}

// Weather code to icon/description mapping
const WEATHER_CODES = {
  0: { icon: '☀️', desc: 'Clear' },
  1: { icon: '🌤️', desc: 'Mostly Clear' },
  2: { icon: '⛅', desc: 'Partly Cloudy' },
  3: { icon: '☁️', desc: 'Cloudy' },
  45: { icon: '🌫️', desc: 'Foggy' },
  48: { icon: '🌫️', desc: 'Foggy' },
  51: { icon: '🌧️', desc: 'Light Drizzle' },
  53: { icon: '🌧️', desc: 'Drizzle' },
  55: { icon: '🌧️', desc: 'Heavy Drizzle' },
  56: { icon: '🌨️', desc: 'Freezing Drizzle' },
  57: { icon: '🌨️', desc: 'Freezing Drizzle' },
  61: { icon: '🌧️', desc: 'Light Rain' },
  63: { icon: '🌧️', desc: 'Rain' },
  65: { icon: '🌧️', desc: 'Heavy Rain' },
  66: { icon: '🌨️', desc: 'Freezing Rain' },
  67: { icon: '🌨️', desc: 'Freezing Rain' },
  71: { icon: '🌨️', desc: 'Light Snow' },
  73: { icon: '🌨️', desc: 'Snow' },
  75: { icon: '❄️', desc: 'Heavy Snow' },
  77: { icon: '🌨️', desc: 'Snow Grains' },
  80: { icon: '🌦️', desc: 'Light Showers' },
  81: { icon: '🌦️', desc: 'Showers' },
  82: { icon: '⛈️', desc: 'Heavy Showers' },
  85: { icon: '🌨️', desc: 'Snow Showers' },
  86: { icon: '🌨️', desc: 'Heavy Snow' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
  96: { icon: '⛈️', desc: 'Thunderstorm' },
  99: { icon: '⛈️', desc: 'Thunderstorm' }
}

// Cache weather data for 30 minutes
let weatherCache = null
let lastFetchTime = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function fetchWeather() {
  const now = Date.now()
  
  // Return cached data if still valid
  if (weatherCache && (now - lastFetchTime) < CACHE_DURATION) {
    return weatherCache
  }
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&current=temperature_2m,weather_code,is_day&timezone=Asia/Kolkata`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error('Weather fetch failed')
    
    const data = await response.json()
    const current = data.current
    
    const weatherCode = current.weather_code
    const weatherInfo = WEATHER_CODES[weatherCode] || { icon: '🌡️', desc: 'Unknown' }
    
    weatherCache = {
      temp: Math.round(current.temperature_2m),
      icon: weatherInfo.icon,
      desc: weatherInfo.desc,
      isDay: current.is_day === 1,
      location: LOCATION.name
    }
    
    lastFetchTime = now
    return weatherCache
    
  } catch (error) {
    console.warn('Weather fetch error:', error)
    // Return cached data even if expired, or null
    return weatherCache || null
  }
}

export function getWeatherEmoji(temp) {
  if (temp >= 35) return '🥵'
  if (temp >= 30) return '🌡️'
  if (temp >= 25) return '😊'
  if (temp >= 20) return '🌤️'
  if (temp >= 15) return '🧥'
  return '🥶'
}
