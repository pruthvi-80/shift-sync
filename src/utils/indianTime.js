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

// Playful, sarcastic splash greetings based on shift + time
export function getSplashGreeting(shift = null) {
  const hour = getIndianHour()
  
  // === SHIFT-SPECIFIC GREETINGS (priority over time-based) ===
  
  // NIGHT SHIFT (N) - 10:30 PM to 7 AM
  if (shift === 'N') {
    const messages = [
      { 
        text: "Night shift warrior mode! 🌙", 
        subtitle: "Ready to own the night, Sunflower? 😼"
      },
      { 
        text: "The night belongs to you! 🦉", 
        subtitle: "My nocturnal sunflower is on duty"
      },
      { 
        text: "Night shift queen reporting! 👑", 
        subtitle: "Even the moon is jealous of your glow 🌚"
      },
      { 
        text: "10:30 PM - 7 AM... let's go! 🌃", 
        subtitle: "Caffeine loaded? Energy drinks ready? 😼"
      },
      { 
        text: "Graveyard shift, huh? 👻", 
        subtitle: "Don't worry, I'll keep you company 💛"
      },
      { 
        text: "Night owl duties calling! 🦉", 
        subtitle: "Go slay that shift, Sunflower! ✨"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // MORNING SHIFT (M) - 6:30 AM to 3 PM
  if (shift === 'M') {
    const messages = [
      { 
        text: "6:30 AM is calling... 📞", 
        subtitle: "Will you answer or hit snooze? 🫠"
      },
      { 
        text: "Early bird shift today! 🐣", 
        subtitle: "Is your alarm clock crying yet? 😼"
      },
      { 
        text: "Morning shift energy! ☀️", 
        subtitle: "Rise and shine, sleepy sunflower!"
      },
      { 
        text: "Up before the sun? 🌅", 
        subtitle: "Who are you and what happened to Snehaa?"
      },
      { 
        text: "6:30 AM to 3 PM grind! 💪", 
        subtitle: "Coffee is your best friend today ☕"
      },
      { 
        text: "Morning warrior mode! 🌻", 
        subtitle: "Early mornings can't defeat my sunflower!"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // AFTERNOON SHIFT (A) - 2:30 PM to 11 PM
  if (shift === 'A') {
    const messages = [
      { 
        text: "Afternoon shift vibes! 🌅", 
        subtitle: "The 2:30-11 PM life chose you 😼"
      },
      { 
        text: "Sleeping in today? 😴", 
        subtitle: "Afternoon shift perks, I see you!"
      },
      { 
        text: "2:30 PM to 11 PM mode! 🌙", 
        subtitle: "Late nights and late mornings 💛"
      },
      { 
        text: "Afternoon gang rise up! 🐣", 
        subtitle: "...whenever you actually wake up 🫠"
      },
      { 
        text: "Evening shift queen! 👑", 
        subtitle: "No 6 AM alarm today, lucky sunflower!"
      },
      { 
        text: "Afternoon duty calls! 📞", 
        subtitle: "Time to bloom in the evening sun 🌻"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // WEEK OFF (WO)
  if (shift === 'WO') {
    const messages = [
      { 
        text: "WEEK OFF! 🎉", 
        subtitle: "Still stalking the roaster? Obsessed much? 😼"
      },
      { 
        text: "Off day and still here? 🐣", 
        subtitle: "You really love this app, don't you? 💛"
      },
      { 
        text: "No work today! 🌻", 
        subtitle: "What adventures await my sunflower? 🫠"
      },
      { 
        text: "Rest day, queen! 👑", 
        subtitle: "Netflix and chill or roaster obsession? 😼"
      },
      { 
        text: "Week off energy! 💫", 
        subtitle: "Sleep, eat, repeat... and check roaster!"
      },
      { 
        text: "Freedom day! 🦋", 
        subtitle: "What will my sunflower do today?"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // LEAVE (L)
  if (shift === 'L') {
    const messages = [
      { 
        text: "On leave today! 🏖️", 
        subtitle: "Enjoy your day off, beautiful sunflower 💛"
      },
      { 
        text: "Leave day vibes! 🌻", 
        subtitle: "Rest well, you deserve it 😼"
      },
      { 
        text: "Taking a break? 🐣", 
        subtitle: "Self-care queen doing self-care things!"
      },
      { 
        text: "Leave approved! ✅", 
        subtitle: "Time to recharge, Sunflower 🔋"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // HOLIDAY (H)
  if (shift === 'H') {
    const messages = [
      { 
        text: "It's a holiday! 🎊", 
        subtitle: "Even sunflowers need rest days 🌻"
      },
      { 
        text: "Holiday mode: ON 🎉", 
        subtitle: "No work, all vibes! 💛"
      },
      { 
        text: "Festive day! 🪔", 
        subtitle: "Enjoy the holiday, my sunflower!"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // TRAINING (T)
  if (shift === 'T') {
    const messages = [
      { 
        text: "Training day! 📚", 
        subtitle: "Learning something new, smarty sunflower? 🧠"
      },
      { 
        text: "Skill upgrade loading... ⏳", 
        subtitle: "My sunflower is leveling up! 😼"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // === TIME-BASED FALLBACK (when no shift or unknown shift) ===
  
  // Midnight owl hours (12 AM - 3 AM)
  if (hour >= 0 && hour < 3) {
    const messages = [
      { 
        text: "Burning the midnight oil? 🌙", 
        subtitle: "Even owls are jealous, Sunflower 🦉"
      },
      { 
        text: "Still awake, night crawler? 😼", 
        subtitle: "The moon called, it wants its glow back"
      },
      { 
        text: "Who needs sleep anyway? 🫠", 
        subtitle: "Not my little nocturnal sunflower!"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Dead of night (3 AM - 5 AM)
  if (hour >= 3 && hour < 5) {
    const messages = [
      { 
        text: "It's 3 AM, Sunflower! 😱", 
        subtitle: "Even ghosts have gone to bed 👻"
      },
      { 
        text: "Hello, sleep-deprived bean 🐣", 
        subtitle: "Your pillow misses you, you know"
      },
      { 
        text: "Plot twist: It's still night 🌚", 
        subtitle: "Sunflowers need sleep too, silly!"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Early bird hours (5 AM - 7 AM)
  if (hour >= 5 && hour < 7) {
    const messages = [
      { 
        text: "Wait... you're UP? 😮", 
        subtitle: "Who are you and what did you do with Snehaa?"
      },
      { 
        text: "The sun isn't even ready! ☀️", 
        subtitle: "But here you are, my early sunflower"
      },
      { 
        text: "Is this... a miracle? 🐣", 
        subtitle: "My sunflower actually woke up early!"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Normal morning (7 AM - 10 AM)
  if (hour >= 7 && hour < 10) {
    const messages = [
      { 
        text: "Good Morning, Sunshine! 🌻", 
        subtitle: "Time to bloom and conquer the world!"
      },
      { 
        text: "Rise and shine, Sleepyhead! ☀️", 
        subtitle: "Your roaster awaits, beautiful 💛"
      },
      { 
        text: "Morning, my sunflower! 🌼", 
        subtitle: "Ready to see when we match? 😼"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Late morning (10 AM - 12 PM)
  if (hour >= 10 && hour < 12) {
    const messages = [
      { 
        text: "Finally decided to wake up? 🫠", 
        subtitle: "The day was getting lonely without you"
      },
      { 
        text: "Look who's alive! 🐣", 
        subtitle: "Late sleeper gang rise up... eventually"
      },
      { 
        text: "Good... morning? Afternoon? 🌻", 
        subtitle: "Let's just say you're fashionably late"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Afternoon (12 PM - 3 PM)
  if (hour >= 12 && hour < 15) {
    const messages = [
      { 
        text: "Afternoon, Sunflower! ☀️", 
        subtitle: "Hope you're having a blooming good day!"
      },
      { 
        text: "Midday check-in! 🌻", 
        subtitle: "Let's see what shifts await us 😼"
      },
      { 
        text: "Hey there, day-shifter! 💛", 
        subtitle: "Time flies when you're this cute"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Late afternoon (3 PM - 6 PM)
  if (hour >= 15 && hour < 18) {
    const messages = [
      { 
        text: "Afternoon vibes! 🌅", 
        subtitle: "Ready to check our schedules? 😼"
      },
      { 
        text: "Hello, evening bloom! 🌻", 
        subtitle: "Tea time for my sunflower? 🍵"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Evening (6 PM - 9 PM)
  if (hour >= 18 && hour < 21) {
    const messages = [
      { 
        text: "Golden hour, golden girl! 🌅", 
        subtitle: "You're prettier than any sunset 💛"
      },
      { 
        text: "Evening, my sunflower! 🌻", 
        subtitle: "Done with work or just starting? 😼"
      },
      { 
        text: "Twilight check-in! ✨", 
        subtitle: "Let's plan when we can hang!"
      }
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  // Night (9 PM - 12 AM)
  const messages = [
    { 
      text: "Night owl mode: ON 🌙", 
      subtitle: "Your natural habitat, I see 🦉"
    },
    { 
      text: "Evening, Night Flower! 🌻", 
      subtitle: "Ready for some roaster stalking? 😼"
    },
    { 
      text: "Late night check-in! 💫", 
      subtitle: "Should you be sleeping? Maybe. Will you? No."
    }
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}
