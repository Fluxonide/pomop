# Pomop - Extended Pomodoro Timer ⏰

A beautiful, feature-rich Pomodoro timer web application with custom settings, task management, audio alerts, and stunning themes.

## ✨ Features

### ⏱️ **Configurable Timer**
- Custom focus duration (1-60 minutes, default: 25)
- Custom short break (1-30 minutes, default: 5)
- Custom long break (5-60 minutes, default: 15)
- Adjustable cycle length (2-8 pomodoros, default: 4)
- Auto-start next phase option

### 📋 **Smart Task Management**
- 12 predefined break activities (stretch, hydrate, meditate, etc.)
- Add/edit/delete custom tasks
- Task selection modal for long breaks
- "Surprise Me" random task suggestion
- Persistent task storage

### 🎨 **Beautiful Themes**
- **5 Premium Themes**: Ocean, Forest, Sunset, Lavender, Minimal
- **Dark/Light Mode**: Independent mode toggle for each theme
- **Glassmorphism**: Modern glass-effect UI with smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 🔊 **Audio System**
- 4 built-in sound options (Bell, Chime, Gong, Ping)
- Custom audio file upload support
- Adjustable volume (0-100%)
- Sound preview before applying
- Separate alerts for timer start and end

### 💡 **User Experience**
- Circular progress indicator with animated arc
- Keyboard shortcuts (Space: start/pause, R: reset, S: skip)
- Browser notifications for timer completion
- Settings persistence via localStorage
- Clean, intuitive interface

## 🚀 Getting Started

### Installation

1. **Clone or download** this repository
2. **No installation required!** It's just HTML, CSS, and JavaScript

### Running Locally

**Option 1: Simple File Open** (Limited functionality)
```bash
# Just open index.html in your browser
# Note: Some features may not work due to CORS restrictions
```

**Option 2: Local Server** (Recommended)
```bash
cd pomop

# Python 3
python3 -m http.server 8000

# Then open: http://localhost:8000
```

**Option 3: Any other web server**
```bash
# Node.js
npx serve

# PHP
php -S localhost:8000
```
# PHP
php -S localhost:8000
```

### Running as Desktop App (Electron)

1. **Install Dependencies**
```bash
npm install
```

2. **Start the App**
```bash
npm start
```
This will launch Pomop as a standalone desktop application.
## 🌐 Deployment

This is a **static web application** with zero dependencies - extremely easy to deploy!

### Deployment Options

**1. GitHub Pages**
- Push to GitHub repository
- Go to Settings → Pages
- Select branch and save
- Access at: `https://yourusername.github.io/pomop`

**2. Netlify**
- Drag and drop the `pomop` folder to [Netlify Drop](https://app.netlify.com/drop)
- Instant deployment!

**3. Vercel**
```bash
npx vercel --prod
```

**4. Any Web Server**
- Upload files to your web hosting (Apache, Nginx, etc.)
- Point to the directory
- Done!

## 🎮 Usage

### Basic Controls

- **Start/Pause**: Click the button or press `Space`
- **Reset**: Click reset button or press `R`
- **Skip**: Click skip button or press `S`
- **Settings**: Click gear icon in top-right corner

### Workflow

1. **Set your preferences** in the settings panel
2. **Start a focus session** (default: 25 minutes)
3. **Take a short break** after each pomodoro
4. **Take a long break** after completing a cycle (default: 4 pomodoros)
5. **Choose a break activity** from the task modal during long breaks

### Customization

- **Adjust durations**: Use sliders in settings to set custom times
- **Choose a theme**: Select from 5 beautiful color schemes
- **Toggle dark/light mode**: Independent of theme selection
- **Set audio alerts**: Choose or upload custom sounds
- **Add break tasks**: Create your own break activity list

## 📁 Project Structure

```
pomop/
├── index.html              # Main HTML structure
├── styles.css              # Complete design system with themes
├── app.js                  # Main application logic
├── modules/
│   ├── timer.js           # Timer engine with state management
│   ├── settings.js        # Settings management & persistence
│   ├── tasks.js           # Task management system
│   └── audio.js           # Audio playback system
├── assets/
│   ├── sounds/            # Audio files (to be added)
│   └── icons/             # SVG icons (optional)
└── README.md              # This file
```

## 🛠️ Technical Details

- **No dependencies**: Pure HTML, CSS, and vanilla JavaScript
- **No build process**: Runs directly in the browser
- **LocalStorage**: All settings and tasks persist between sessions
- **ES6 Modules**: Clean, modular code architecture
- **Responsive**: Mobile-first CSS with flexbox/grid
- **Accessible**: Semantic HTML with ARIA labels

## 🎨 Themes

1. **Ocean** - Calming blue gradients (default)
2. **Forest** - Natural green tones
3. **Sunset** - Vibrant orange and purple
4. **Lavender** - Soothing purple and pink
5. **Minimal** - Clean grayscale aesthetic

Each theme supports both light and dark modes!

## 🔧 Customization

### Adding Audio Files

To add real audio files, place them in `assets/sounds/` and update the paths in `modules/audio.js`:

```javascript
this.sounds = {
  bell: 'assets/sounds/bell.mp3',
  chime: 'assets/sounds/chime.mp3',
  gong: 'assets/sounds/gong.mp3',
  ping: 'assets/sounds/ping.mp3'
};
```

Currently, audio files are placeholders. You can either:
- Add your own MP3/WAV files to `assets/sounds/`
- Use the custom upload feature in settings
- Find free sounds at [freesound.org](https://freesound.org) or [zapsplat.com](https://www.zapsplat.com)

## 📱 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

**Recommended**: Modern browsers with ES6 module support

## 🤝 Contributing

This is a standalone project, but feel free to:
- Fork and customize for your needs
- Add new themes
- Create additional break task suggestions
- Improve animations and transitions

## 📄 License

Free to use and modify for personal and commercial projects.

## 🙏 Credits

- **Design**: Modern glassmorphism with gradient backgrounds
- **Fonts**: Inter and Outfit from Google Fonts
- **Icons**: Unicode emojis for universal compatibility

---

**Made with ❤️ for productivity enthusiasts**

Enjoy focused work sessions with Pomop! 🚀
