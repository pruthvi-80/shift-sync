# Sunflower Sync 🌻

A responsive Progressive Web Application (PWA) for comparing daily work shifts between two users across a selected month.

## Features

- 📅 **Daily Full-Screen View** - Display one day at a time with smooth transitions
- 🗓️ **Monthly Overview** - Calendar grid with matching days highlighted
- 🎉 **Match Animations** - Confetti and celebrations when shifts match
- 💾 **Local Storage** - Data persists across sessions
- 📱 **PWA Support** - Install as an app on mobile devices
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate days
- 👆 **Swipe Support** - Swipe left/right on mobile to change days

## Shift Codes

| Code | Description | Emoji |
|------|-------------|-------|
| M | Morning | 🌅 |
| A | Afternoon | ☀️ |
| N | Night | 🌙 |
| STS | General Shift | 💼 |
| US | US Shift | 🇺🇸 |
| L | Leave | 🏖️ |
| WO | Week Off | 😴 |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **date-fns** - Date manipulation
- **canvas-confetti** - Celebration animations
- **vite-plugin-pwa** - PWA support

## License

MIT
