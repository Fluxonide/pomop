// ============================================
// POMOP - Audio System Module
// ============================================

// Synthesizer for fallback audio
class Synth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    }

    setVolume(value) {
        this.masterGain.gain.setValueAtTime(value, this.ctx.currentTime);
    }

    playTone(freq, type, duration, release = 0.1) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.connect(this.masterGain);
        osc.connect(gain);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration + release);

        osc.start(now);
        osc.stop(now + duration + release + 0.1);

        // Cleanup
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, (duration + release + 0.2) * 1000);
    }

    // Presets
    bell() {
        // Bell-like sound: Sine wave with long decay
        this.playTone(523.25, 'sine', 0.1, 1.5); // C5
        setTimeout(() => this.playTone(1046.5, 'sine', 0.1, 1.5), 50); // C6 overtone
    }

    chime() {
        // Chime: Higher pitch, sparkle
        this.playTone(880, 'triangle', 0.1, 1.0); // A5
        setTimeout(() => this.playTone(1318.51, 'sine', 0.1, 1.2), 100); // E6
    }

    gong() {
        // Gong: Low, complex
        this.playTone(196.00, 'sawtooth', 0.2, 2.0); // G3
        this.playTone(130.81, 'sine', 0.2, 2.0); // C3
    }

    ping() {
        // Ping: Short, clean
        this.playTone(1567.98, 'sine', 0.05, 0.3); // G6
    }
}

export class AudioManager {
    constructor() {
        this.sounds = {
            bell: 'assets/sounds/bell.mp3',
            chime: 'assets/sounds/chime.mp3',
            gong: 'assets/sounds/gong.mp3',
            ping: 'assets/sounds/ping.mp3'
        };
        this.customSounds = this.loadCustomSounds();
        this.volume = 0.7;

        // Initialize synthesizer
        this.synth = new Synth();
        this.synth.setVolume(this.volume);
    }

    // Load custom sounds from localStorage
    loadCustomSounds() {
        try {
            const stored = localStorage.getItem('pomop-custom-sounds');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading custom sounds:', error);
        }
        return {};
    }

    // Save custom sounds to localStorage
    saveCustomSounds() {
        try {
            localStorage.setItem('pomop-custom-sounds', JSON.stringify(this.customSounds));
            return true;
        } catch (error) {
            console.error('Error saving custom sounds:', error);
            return false;
        }
    }

    // Get all available sounds
    getAllSounds() {
        return { ...this.sounds, ...this.customSounds };
    }

    // Set volume (0-100)
    setVolume(volume) {
        const normVolume = Math.max(0, Math.min(100, volume)) / 100;
        this.volume = normVolume;
        if (this.synth) {
            this.synth.setVolume(normVolume);
        }
    }

    // Play sound
    play(soundName) {
        const allSounds = this.getAllSounds();
        const soundUrl = allSounds[soundName];

        // If it's a built-in sound and file likely doesn't exist (or failed previously),
        // or if we want to fallback immediately, we can check.
        // For now, let's try to play file, and catch error.
        // BUT, since we KNOW files are placeholders, let's prioritize Synth for default names
        // unless a custom sound with that name exists (which shouldn't happen with this structure).

        // Actually, let's try to play standard HTML5 Audio first.
        // If it fails (error), fallback to synth.

        // HOWEVER, to avoid "error in console" spam for known missing files,
        // we can check if it's one of our default keys and use synth directly
        // IF we assume the files are missing.
        // But the requirements say "ensure code handles missing sounds gracefully".
        // A robust way is: try play, on error -> synth.

        // But since I verified the files are missing, I'll force synth for defaults
        // if no custom file overrides it.

        if (this.sounds[soundName] && !this.customSounds[soundName]) {
            // It is a default sound. Use Synth directy to avoid 404 errors.
            if (this.synth[soundName]) {
                this.synth[soundName]();
                return;
            }
        }

        if (!soundUrl) {
            console.error(`Sound "${soundName}" not found`);
            return;
        }

        try {
            const audio = new Audio(soundUrl);
            audio.volume = this.volume;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Audio play failed (likely missing file), falling back to synth:', error);
                    // Fallback to synth if possible
                    if (this.synth[soundName]) {
                        this.synth[soundName]();
                    }
                });
            }
        } catch (error) {
            console.error('Error creating audio:', error);
        }
    }

    // Preview sound
    preview(soundName) {
        this.play(soundName);
    }

    // Add custom sound from file
    async addCustomSound(name, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const dataUrl = e.target.result;
                    this.customSounds[name] = dataUrl;
                    this.saveCustomSounds();
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    // Delete custom sound
    deleteCustomSound(name) {
        if (this.customSounds[name]) {
            delete this.customSounds[name];
            this.saveCustomSounds();
            return true;
        }
        return false;
    }

    // Check if sound exists
    hasSound(name) {
        const allSounds = this.getAllSounds();
        return !!allSounds[name];
    }
}
