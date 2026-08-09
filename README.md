# Sunflower Sync 🌻

A beautiful shift tracking PWA made with love for Snehaa 💛

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

## Usage

1. Click "Enter Your Roster" to input shift data
2. Select the month you want to track
3. Use "Quick Fill" to quickly set the same shift for all days
4. Or manually select shifts for each day
5. Click "Save Roster" to save your data
6. Navigate between days using buttons, keyboard arrows, or swipe gestures
7. View the monthly overview to see all matching days at a glance

## License

MIT
