// ============================================
// POMOP - Music Player Module
// ============================================

export class MusicPlayer {
    constructor() {
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.audio = new Audio();
        this.isPlaying = false;
        this.shuffle = false;
        this.repeat = 'none'; // 'none', 'one', 'all'
        this.listeners = {};

        // Load saved playlist from localStorage
        this.loadPlaylist();

        // Set up audio event listeners
        this.setupAudioListeners();
    }

    // Event emitter
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Set up audio element event listeners
    setupAudioListeners() {
        this.audio.addEventListener('ended', () => {
            if (this.repeat === 'one') {
                this.audio.currentTime = 0;
                this.audio.play();
            } else {
                this.next();
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            this.emit('timeupdate', {
                currentTime: this.audio.currentTime,
                duration: this.audio.duration,
                progress: (this.audio.currentTime / this.audio.duration) * 100
            });
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.emit('trackloaded', {
                duration: this.audio.duration
            });
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.emit('play', { trackIndex: this.currentTrackIndex });
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.emit('pause', { trackIndex: this.currentTrackIndex });
        });
    }

    // Add music file to playlist
    async addTrack(file) {
        return new Promise((resolve, reject) => {
            // Check if running in Electron (file has path property)
            if (file.path) {
                const track = {
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    fileName: file.name,
                    path: file.path, // Store path instead of data
                    duration: 0
                };

                this.playlist.push(track);
                this.savePlaylist();
                this.emit('trackadded', { track });
                resolve(track);
                return;
            }

            // Web fallback: Read file into memory (size limited)
            const reader = new FileReader();

            reader.onload = (e) => {
                const track = {
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    fileName: file.name,
                    data: e.target.result,
                    duration: 0
                };

                this.playlist.push(track);
                this.savePlaylist();
                this.emit('trackadded', { track });
                resolve(track);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    // Remove track from playlist
    removeTrack(trackId) {
        const index = this.playlist.findIndex(t => t.id === trackId);
        if (index === -1) return;

        // If removing current track, stop playback
        if (index === this.currentTrackIndex) {
            this.stop();
        }

        this.playlist.splice(index, 1);

        // Adjust current track index if needed
        if (this.currentTrackIndex > index) {
            this.currentTrackIndex--;
        }

        this.savePlaylist();
        this.emit('trackremoved', { trackId });
    }

    // Play track by index
    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        if (track.path) {
            this.audio.src = track.path;
        } else {
            this.audio.src = track.data;
        }

        this.audio.play().catch(err => {
            console.error('Error playing track:', err);
            this.emit('error', { message: 'Failed to play track: ' + err.message });
        });

        this.emit('trackchange', { track, index });
    }

    // Play/pause toggle
    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.currentTrackIndex === -1) {
                this.playTrack(0);
            } else {
                this.audio.play();
            }
        }
    }

    // Pause playback
    pause() {
        this.audio.pause();
    }

    // Stop playback
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.currentTrackIndex = -1;
        this.emit('stop', {});
    }

    // Next track
    next() {
        if (this.playlist.length === 0) return;

        let nextIndex;

        if (this.shuffle) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = this.currentTrackIndex + 1;
            if (nextIndex >= this.playlist.length) {
                if (this.repeat === 'all') {
                    nextIndex = 0;
                } else {
                    this.stop();
                    return;
                }
            }
        }

        this.playTrack(nextIndex);
    }

    // Previous track
    previous() {
        if (this.playlist.length === 0) return;

        // If more than 3 seconds into the track, restart it
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
            if (this.repeat === 'all') {
                prevIndex = this.playlist.length - 1;
            } else {
                prevIndex = 0;
            }
        }

        this.playTrack(prevIndex);
    }

    // Set volume (0-100)
    setVolume(volume) {
        this.audio.volume = volume / 100;
    }

    // Toggle shuffle
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        this.emit('shufflechange', { shuffle: this.shuffle });
        return this.shuffle;
    }

    // Toggle repeat mode
    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeat);
        this.repeat = modes[(currentIndex + 1) % modes.length];
        this.emit('repeatchange', { repeat: this.repeat });
        return this.repeat;
    }

    // Seek to position (0-100)
    seek(percentage) {
        if (this.audio.duration) {
            this.audio.currentTime = (percentage / 100) * this.audio.duration;
        }
    }

    // Get current track
    getCurrentTrack() {
        if (this.currentTrackIndex === -1) return null;
        return this.playlist[this.currentTrackIndex];
    }

    // Get playlist
    getPlaylist() {
        return [...this.playlist];
    }

    // Save playlist to localStorage
    savePlaylist() {
        try {
            // Store playlist metadata and data
            localStorage.setItem('pomop-music-playlist', JSON.stringify(this.playlist));
        } catch (error) {
            console.error('Error saving playlist:', error);
            // If quota exceeded, try to save without data
            try {
                const metadataOnly = this.playlist.map(t => ({
                    id: t.id,
                    name: t.name,
                    fileName: t.fileName
                }));
                localStorage.setItem('pomop-music-playlist-meta', JSON.stringify(metadataOnly));
            } catch (e) {
                console.error('Failed to save playlist metadata:', e);
            }
        }
    }

    // Load playlist from localStorage
    loadPlaylist() {
        try {
            const stored = localStorage.getItem('pomop-music-playlist');
            if (stored) {
                this.playlist = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
        }
    }

    // Clear entire playlist
    clearPlaylist() {
        this.stop();
        this.playlist = [];
        this.savePlaylist();
        this.emit('playlistcleared', {});
    }
}
