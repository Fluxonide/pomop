// ============================================
// POMOP - Settings Management Module
// ============================================

const DEFAULT_SETTINGS = {
    focusDuration: 25,        // minutes
    shortBreakDuration: 5,    // minutes
    longBreakDuration: 15,    // minutes
    cycleLength: 4,           // pomodoros until long break
    autoStart: true,          // auto-start next phase (always on)
    volume: 70,               // 0-100
    soundStart: 'chime',      // sound for timer start
    soundEnd: 'bell',         // sound for timer end
    theme: 'ocean',           // ocean, forest, sunset, lavender, minimal
    mode: 'dark',             // dark only
    notifications: true       // browser notifications
};

export class Settings {
    constructor() {
        this.settings = this.load();
    }

    // Load settings from localStorage
    load() {
        try {
            const stored = localStorage.getItem('pomop-settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return { ...DEFAULT_SETTINGS };
    }

    // Save settings to localStorage
    save() {
        try {
            localStorage.setItem('pomop-settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Get a setting value
    get(key) {
        return this.settings[key];
    }

    // Set a setting value
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    // Get all settings
    getAll() {
        return { ...this.settings };
    }

    // Update multiple settings
    update(updates) {
        this.settings = { ...this.settings, ...updates };
        this.save();
    }

    // Reset to defaults
    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
    }

    // Apply theme
    applyTheme() {
        const { theme, mode } = this.settings;
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-mode', mode);
    }
}
