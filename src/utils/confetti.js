import confetti from 'canvas-confetti'

// Safely call confetti with error handling
function safeConfetti(options) {
  try {
    confetti(options)
  } catch (e) {
    console.warn('Confetti error:', e)
  }
}

export function fireConfetti() {
  // Celebratory confetti burst - sunflower themed
  const count = 150
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  }

  function fire(particleRatio, opts) {
    safeConfetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#fbbf24', '#f59e0b', '#d97706'] })
  fire(0.2, { spread: 60, colors: ['#fcd34d', '#fbbf24', '#f59e0b'] })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#fef3c7', '#fde68a', '#fcd34d'] })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#92400e', '#78350f'] })
}

export function fireMatchConfetti() {
  // Sunflower confetti for matches! 🌻
  const duration = 2500
  const animationEnd = Date.now() + duration
  const colors = ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef3c7', '#92400e']

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 40 * (timeLeft / duration)

    safeConfetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2
      },
      colors,
      zIndex: 9999
    })
  }, 200)
}

export function fireHearts() {
  // Special sunflower effect for when both are on leave together 💛
  try {
    const sunflower = confetti.shapeFromText({ text: '🌻', scalar: 2 })
    const heart = confetti.shapeFromText({ text: '💛', scalar: 2 })
    
    safeConfetti({
      shapes: [sunflower, heart],
      scalar: 2,
      spread: 180,
      particleCount: 30,
      origin: { y: 0.6 },
      startVelocity: 25,
      gravity: 0.5,
      zIndex: 9999
    })
  } catch (e) {
    console.warn('Hearts shape error:', e)
  }
  
  // Also add some golden confetti
  safeConfetti({
    particleCount: 60,
    spread: 100,
    origin: { y: 0.65 },
    colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#fef3c7', '#d97706'],
    zIndex: 9999
  })
}

export function fireSadEffect() {
  // No effect for non-matching - keeping it clean
}
