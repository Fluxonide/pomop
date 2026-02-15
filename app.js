// ============================================
// POMOP - Main Application
// ============================================

import { Timer } from './modules/timer.js';
import { Settings } from './modules/settings.js';
import { TaskManager } from './modules/tasks.js';
import { AudioManager } from './modules/audio.js';
import { MusicPlayer } from './modules/music.js';

// ============================================
// Initialize App
// ============================================

class PomopApp {
    constructor() {
        // Initialize modules
        this.settings = new Settings();
        this.timer = new Timer();
        this.taskManager = new TaskManager();
        this.audio = new AudioManager();
        this.musicPlayer = new MusicPlayer();

        // UI Elements
        this.initializeElements();

        // Initialize timer with settings
        const currentSettings = this.settings.getAll();
        console.log('Initializing timer with settings:', currentSettings);
        this.timer.init(currentSettings);

        // Set up event listeners
        this.setupTimerListeners();
        this.setupUIListeners();
        this.setupSettingsListeners();
        this.setupTaskListeners();
        this.setupMusicPlayerListeners();

        // Apply theme
        this.settings.applyTheme();

        // Load settings into UI
        this.loadSettingsToUI();

        // Request notification permission
        this.requestNotificationPermission();

        // Update UI to show user's configured time
        const timerState = this.timer.getState();
        console.log('Timer state after init:', timerState);
        this.updateUI();
    }

    initializeElements() {
        // Timer elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.phaseLabel = document.getElementById('phaseLabel');
        this.cycleIndicator = document.getElementById('cycleIndicator');
        this.progressDots = document.getElementById('progressDots');
        this.timerProgress = document.getElementById('timerProgress');
        this.timerGlow = document.querySelector('.timer-glow-pulse');

        // Control buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');

        // Settings
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');

        // Task modal
        this.taskModal = document.getElementById('taskModal');
        this.closeTaskModal = document.getElementById('closeTaskModal');
        this.tasksGrid = document.getElementById('tasksGrid');
        this.randomTaskBtn = document.getElementById('randomTaskBtn');
        this.startBreakBtn = document.getElementById('startBreakBtn');
        this.customTaskInput = document.getElementById('customTaskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.customTasksList = document.getElementById('customTasksList');

        // Music player
        this.musicPlayerToggle = document.getElementById('musicPlayerToggle');
        this.musicPlayerPanel = document.querySelector('.music-player-panel');
        this.musicUpload = document.getElementById('musicUpload');
        this.musicFolderUpload = document.getElementById('musicFolderUpload');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.previousBtn = document.getElementById('previousBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.musicProgress = document.getElementById('musicProgress');
        this.musicVolume = document.getElementById('musicVolume');
        this.musicVolumeValue = document.getElementById('musicVolumeValue');
        this.currentTrackName = document.getElementById('currentTrackName');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        this.musicPlaylist = document.getElementById('musicPlaylist');
        this.clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
    }

    // ============================================
    // Timer Event Listeners
    // ============================================

    setupTimerListeners() {
        this.timer.on('tick', (data) => {
            this.updateTimerDisplay(data);
        });

        this.timer.on('phaseChange', (data) => {
            this.updatePhaseUI(data);
            this.updateTimerDisplay(data);
            // Update cycle indicator on phase change to ensure correctness (e.g. after long break reset)
            this.updateCycleIndicator({ cycle: (this.timer.currentCycle || 0) + 1 });
        });

        this.timer.on('complete', (data) => {
            this.handleTimerComplete(data);
        });

        this.timer.on('pomodoroComplete', (data) => {
            this.updateCycleIndicator(data);
        });

        this.timer.on('longBreakTime', () => {
            this.showTaskModal();
        });

        this.timer.on('start', () => {
            this.audio.setVolume(this.settings.get('volume'));
            this.updateControlButtons();
        });

        this.timer.on('pause', () => {
            this.updateControlButtons();
        });

        this.timer.on('reset', (data) => {
            this.updateTimerDisplay(data);
            this.updateControlButtons();
        });
    }

    // ============================================
    // UI Event Listeners
    // ============================================

    setupUIListeners() {
        // Timer controls
        this.startBtn.addEventListener('click', () => this.timer.start());
        this.pauseBtn.addEventListener('click', () => this.timer.pause());
        this.resetBtn.addEventListener('click', () => this.timer.reset());
        this.skipBtn.addEventListener('click', () => this.timer.skip());

        // Settings panel
        this.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.toggleSettings());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.timer.state === 'running' ? this.timer.pause() : this.timer.start();
                    break;
                case 'r':
                    this.timer.reset();
                    break;
                case 's':
                    this.timer.skip();
                    break;
            }
        });
    }

    // ============================================
    // Settings Listeners
    // ============================================

    setupSettingsListeners() {
        const settings = [
            { id: 'focusDuration', key: 'focusDuration', valueId: 'focusValue' },
            { id: 'shortBreakDuration', key: 'shortBreakDuration', valueId: 'shortBreakValue' },
            { id: 'longBreakDuration', key: 'longBreakDuration', valueId: 'longBreakValue' },
            { id: 'cycleLength', key: 'cycleLength', valueId: 'cycleValue' },
            { id: 'volume', key: 'volume', valueId: 'volumeValue' }
        ];

        settings.forEach(({ id, key, valueId }) => {
            const element = document.getElementById(id);
            const valueElement = document.getElementById(valueId);

            element.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.settings.set(key, value);
                valueElement.textContent = value;

                // Reinitialize timer if duration settings changed
                if (['focusDuration', 'shortBreakDuration', 'longBreakDuration', 'cycleLength'].includes(key)) {
                    this.timer.init(this.settings.getAll());
                    this.updateUI();
                    // Update progress dots when cycle length changes
                    if (key === 'cycleLength') {
                        const state = this.timer.getState();
                        this.updateProgressDots((state.currentCycle || 0) + 1, value);
                    }
                }

                // Update volume
                if (key === 'volume') {
                    this.audio.setVolume(value);
                }
            });
        });



        // Notifications checkbox
        document.getElementById('notifications').addEventListener('change', (e) => {
            this.settings.set('notifications', e.target.checked);
            if (e.target.checked) {
                this.requestNotificationPermission();
            }
        });

        // Theme selection
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.set('theme', e.target.dataset.theme);
                this.settings.applyTheme();
            });
        });



        // Audio selection
        document.querySelectorAll('.audio-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const soundName = e.currentTarget.dataset.sound;
                if (soundName) {
                    document.querySelectorAll('.audio-option').forEach(o => o.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    this.settings.set('soundEnd', soundName);
                }
            });
        });

        // Audio preview
        document.querySelectorAll('.audio-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const soundName = e.target.dataset.preview;
                this.audio.setVolume(this.settings.get('volume'));
                this.audio.preview(soundName);
            });
        });

        // Custom sound upload
        const customSoundUpload = document.getElementById('customSoundUpload');
        if (customSoundUpload) {
            customSoundUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate file type
                const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
                if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
                    alert('Please upload a valid audio file (MP3, WAV, or OGG)');
                    return;
                }

                // Validate file size (2MB limit)
                const maxSize = 2 * 1024 * 1024; // 2MB
                if (file.size > maxSize) {
                    alert('File size must be less than 2MB');
                    return;
                }

                try {
                    // Generate a unique name from the filename
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const soundName = `custom_${baseName}_${Date.now()}`;

                    await this.audio.addCustomSound(soundName, file);
                    this.renderCustomSounds();

                    // Clear the input
                    e.target.value = '';
                } catch (error) {
                    console.error('Error uploading custom sound:', error);
                    alert('Failed to upload sound. Please try again.');
                }
            });
        }

        // Render custom sounds on load
        this.renderCustomSounds();
    }

    // Render custom sounds list
    renderCustomSounds() {
        const customSoundsList = document.getElementById('customSoundsList');
        if (!customSoundsList) return;

        const customSounds = this.audio.customSounds;
        const soundKeys = Object.keys(customSounds);

        if (soundKeys.length === 0) {
            customSoundsList.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 1rem; font-size: 0.85rem;">No custom sounds uploaded</div>';
            return;
        }

        const currentSound = this.settings.get('soundEnd');

        customSoundsList.innerHTML = soundKeys.map(soundKey => {
            // Extract display name from the sound key
            const displayName = soundKey.replace(/^custom_/, '').replace(/_\d+$/, '');
            const isActive = currentSound === soundKey ? 'active' : '';

            return `
                <div class="custom-sound-item ${isActive}" data-sound="${soundKey}">
                    <span class="custom-sound-name">🎵 ${displayName}</span>
                    <div class="custom-sound-actions">
                        <button class="audio-preview" data-preview="${soundKey}">▶</button>
                        <button class="custom-sound-delete" data-delete="${soundKey}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to custom sound items
        customSoundsList.querySelectorAll('.custom-sound-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons
                if (e.target.closest('button')) return;

                const soundName = item.dataset.sound;
                document.querySelectorAll('.audio-option, .custom-sound-item').forEach(o => o.classList.remove('active'));
                item.classList.add('active');
                this.settings.set('soundEnd', soundName);
            });
        });

        // Add event listeners to preview buttons
        customSoundsList.querySelectorAll('.audio-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const soundName = e.target.dataset.preview;
                this.audio.setVolume(this.settings.get('volume'));
                this.audio.preview(soundName);
            });
        });

        // Add event listeners to delete buttons
        customSoundsList.querySelectorAll('.custom-sound-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const soundName = e.target.dataset.delete;

                if (confirm('Delete this custom sound?')) {
                    this.audio.deleteCustomSound(soundName);

                    // If this was the selected sound, reset to default
                    if (this.settings.get('soundEnd') === soundName) {
                        this.settings.set('soundEnd', 'bell');
                        document.querySelector('.audio-option[data-sound="bell"]')?.classList.add('active');
                    }

                    this.renderCustomSounds();
                }
            });
        });
    }

    // ============================================
    // Task Modal Listeners
    // ============================================

    setupTaskListeners() {
        // Close modal
        this.closeTaskModal.addEventListener('click', () => this.hideTaskModal());

        // Click outside modal to close
        this.taskModal.addEventListener('click', (e) => {
            if (e.target === this.taskModal) {
                this.hideTaskModal();
            }
        });

        // Random task
        this.randomTaskBtn.addEventListener('click', () => {
            const task = this.taskManager.getRandomTask();
            this.selectTask(task.id);
        });

        // Start break
        this.startBreakBtn.addEventListener('click', () => {
            this.hideTaskModal();
        });

        // Add custom task
        this.addTaskBtn.addEventListener('click', () => this.addCustomTask());
        this.customTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomTask();
            }
        });

        // Populate tasks
        this.populateTasks();
    }

    // ============================================
    // Music Player Listeners
    // ============================================

    setupMusicPlayerListeners() {
        // Toggle button
        this.musicPlayerToggle.addEventListener('click', () => {
            this.musicPlayerPanel.classList.toggle('hidden');
            this.musicPlayerToggle.classList.toggle('active');

            // Rotate chevron icon
            if (this.musicPlayerPanel.classList.contains('hidden')) {
                this.musicPlayerToggle.textContent = '‹';
            } else {
                this.musicPlayerToggle.textContent = '›';
            }
        });

        // Music Upload Handler
        const handleMusicUpload = async (e) => {
            const files = Array.from(e.target.files);

            if (files.length === 0) return;

            // Show processing message
            const statusMsg = document.createElement('div');
            statusMsg.style.position = 'fixed';
            statusMsg.style.bottom = '20px';
            statusMsg.style.right = '20px';
            statusMsg.style.padding = '1rem';
            statusMsg.style.background = 'rgba(0,0,0,0.8)';
            statusMsg.style.color = '#fff';
            statusMsg.style.borderRadius = '8px';
            statusMsg.style.zIndex = '1000';
            statusMsg.textContent = `Processing ${files.length} files...`;
            document.body.appendChild(statusMsg);

            let addedCount = 0;

            for (const file of files) {
                // Validate file type
                const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
                if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
                    continue;
                }

                // Size check: Only check if NOT in Electron (no path)
                if (!file.path) {
                    const maxSize = 200 * 1024 * 1024;
                    if (file.size > maxSize) {
                        alert(`Skipping ${file.name}: File too large (max 200MB)`);
                        continue;
                    }
                }

                try {
                    await this.musicPlayer.addTrack(file);
                    addedCount++;
                } catch (error) {
                    console.error('Error adding track:', error);
                }
            }

            document.body.removeChild(statusMsg);

            if (addedCount > 0) {
                if (this.musicPlayer.playlist.length === addedCount) {
                    this.musicPlayer.playTrack(0);
                } else {
                    alert(`Added ${addedCount} tracks to playlist!`);
                }
            }

            e.target.value = ''; // Clear input
        };

        // File upload
        this.musicUpload.addEventListener('change', handleMusicUpload);

        // Folder upload
        if (this.musicFolderUpload) {
            this.musicFolderUpload.addEventListener('change', handleMusicUpload);
        }

        // Playback controls
        this.playPauseBtn.addEventListener('click', () => {
            this.musicPlayer.togglePlay();
        });

        this.previousBtn.addEventListener('click', () => {
            this.musicPlayer.previous();
        });

        this.nextBtn.addEventListener('click', () => {
            this.musicPlayer.next();
        });

        this.shuffleBtn.addEventListener('click', () => {
            const shuffle = this.musicPlayer.toggleShuffle();
            this.shuffleBtn.classList.toggle('active', shuffle);
        });

        this.repeatBtn.addEventListener('click', () => {
            const repeat = this.musicPlayer.toggleRepeat();
            this.repeatBtn.classList.toggle('active', repeat !== 'none');
            // Update title only, SVG stays the same
            const repeatTitles = { none: 'Repeat Off', one: 'Repeat One', all: 'Repeat All' };
            this.repeatBtn.title = repeatTitles[repeat];
            this.repeatBtn.dataset.repeat = repeat;
        });

        // Volume control
        this.musicVolume.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            this.musicPlayer.setVolume(volume);
            this.musicVolumeValue.textContent = `${volume}%`;
        });

        // Progress seeking
        this.musicProgress.addEventListener('input', (e) => {
            const percentage = parseInt(e.target.value);
            this.musicPlayer.seek(percentage);
        });

        // Clear playlist
        this.clearPlaylistBtn.addEventListener('click', () => {
            if (confirm('Clear entire playlist?')) {
                this.musicPlayer.clearPlaylist();
                this.renderPlaylist();
            }
        });

        // Music player events
        this.musicPlayer.on('trackadded', () => {
            this.renderPlaylist();
        });

        this.musicPlayer.on('trackremoved', () => {
            this.renderPlaylist();
        });

        this.musicPlayer.on('trackchange', (data) => {
            this.updateNowPlaying(data.track);
            this.renderPlaylist();
        });

        this.musicPlayer.on('play', () => {
            this.playPauseBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
            `;
            this.playPauseBtn.title = 'Pause';
        });

        this.musicPlayer.on('pause', () => {
            this.playPauseBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            this.playPauseBtn.title = 'Play';
        });

        this.musicPlayer.on('stop', () => {
            this.playPauseBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            this.playPauseBtn.title = 'Play';
            this.currentTrackName.textContent = 'No track playing';
            this.currentTime.textContent = '0:00';
            this.musicProgress.value = 0;
        });

        this.musicPlayer.on('timeupdate', (data) => {
            this.currentTime.textContent = this.formatTime(data.currentTime);
            this.musicProgress.value = data.progress || 0;
        });

        this.musicPlayer.on('trackloaded', (data) => {
            this.totalTime.textContent = this.formatTime(data.duration);
        });

        this.musicPlayer.on('playlistcleared', () => {
            this.renderPlaylist();
            this.currentTrackName.textContent = 'No track playing';
            this.currentTime.textContent = '0:00';
            this.totalTime.textContent = '0:00';
            this.musicProgress.value = 0;
        });

        // Initial render
        this.renderPlaylist();
    }

    // Update now playing display
    updateNowPlaying(track) {
        if (track) {
            this.currentTrackName.textContent = track.name;
        }
    }

    // Render playlist
    renderPlaylist() {
        const playlist = this.musicPlayer.getPlaylist();
        const currentTrack = this.musicPlayer.getCurrentTrack();

        if (playlist.length === 0) {
            this.musicPlaylist.innerHTML = '<div class="playlist-empty">No tracks in playlist</div>';
            return;
        }

        this.musicPlaylist.innerHTML = playlist.map((track, index) => {
            const isActive = currentTrack && currentTrack.id === track.id;
            return `
                <div class="playlist-item ${isActive ? 'active' : ''}" data-track-index="${index}">
                    <div class="playlist-item-info">
                        <div class="playlist-item-name">${track.name}</div>
                    </div>
                    <div class="playlist-item-actions">
                        <button class="playlist-item-btn" data-remove-track="${track.id}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to playlist items
        this.musicPlaylist.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const index = parseInt(item.dataset.trackIndex);
                this.musicPlayer.playTrack(index);
            });
        });

        // Add remove listeners
        this.musicPlaylist.querySelectorAll('[data-remove-track]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = parseFloat(btn.dataset.removeTrack);
                this.musicPlayer.removeTrack(trackId);
            });
        });
    }

    // Format time helper
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ============================================
    // UI Updates
    // ============================================

    updateTimerDisplay(data) {
        console.log('updateTimerDisplay called with data:', data);
        const minutes = Math.floor(data.timeRemaining / 60);
        const seconds = data.timeRemaining % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        console.log('Setting timer display to:', formatted);
        this.timerDisplay.textContent = formatted;

        // Update circular progress
        const circumference = 2 * Math.PI * 155; // Compute from radius to avoid drift
        // Clamp progress to [0, 100] and snap near-100% values so the ring fully closes
        let progress = typeof data.progress === 'number' ? data.progress : 0;
        progress = Math.max(0, Math.min(100, progress));
        if (progress > 99.5) progress = 100;

        // Visually, we want a FULL ring at the start that shrinks as time runs out.
        // data.progress is "elapsed" percentage, so invert it for display.
        const displayProgress = 100 - progress;
        const offset = circumference - (displayProgress / 100) * circumference;
        this.timerProgress.style.strokeDashoffset = offset;

        // Update document title
        document.title = `${formatted} - Pomop`;
    }

    updatePhaseUI(data) {
        const phaseLabels = {
            focus: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };

        this.phaseLabel.textContent = phaseLabels[data.phase] || 'Focus Time';

        // Update data attribute for CSS styling
        document.documentElement.setAttribute('data-phase', data.phase);

        // Update progress color based on phase
        // Color is handled purely via CSS `[data-phase] .timer-circle-progress`
        // so we don't need to set an inline stroke color here.
    }

    updateCycleIndicator(data) {
        const cycleLength = this.settings.get('cycleLength');
        this.cycleIndicator.textContent = `Pomodoro ${data.cycle} of ${cycleLength}`;
        this.updateProgressDots(data.cycle, cycleLength);
    }

    updateProgressDots(currentCycle, totalCycles) {
        // Check if element exists
        if (!this.progressDots) {
            console.error('Progress dots element not found!');
            return;
        }

        console.log('Updating progress dots:', { currentCycle, totalCycles });

        // Clear existing dots
        this.progressDots.innerHTML = '';

        // Create dots for each pomodoro in the cycle
        for (let i = 1; i <= totalCycles; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';

            if (i < currentCycle) {
                // Completed pomodoros
                dot.classList.add('completed');
            } else if (i === currentCycle) {
                // Current pomodoro
                dot.classList.add('current');
            }
            // Upcoming pomodoros have no additional class

            this.progressDots.appendChild(dot);
        }

        console.log('Progress dots created:', this.progressDots.children.length);
    }

    updateControlButtons() {
        const isRunning = this.timer.state === 'running';

        this.startBtn.classList.toggle('hidden', isRunning);
        this.pauseBtn.classList.toggle('hidden', !isRunning);
    }

    updateUI() {
        const state = this.timer.getState();
        this.updateTimerDisplay(state);
        this.updatePhaseUI(state);
        this.updateCycleIndicator({ cycle: (state.currentCycle || 0) + 1 });
        this.updateControlButtons();
    }

    // ============================================
    // Settings UI
    // ============================================

    loadSettingsToUI() {
        const settings = this.settings.getAll();

        // Duration settings
        document.getElementById('focusDuration').value = settings.focusDuration;
        document.getElementById('focusValue').textContent = settings.focusDuration;

        document.getElementById('shortBreakDuration').value = settings.shortBreakDuration;
        document.getElementById('shortBreakValue').textContent = settings.shortBreakDuration;

        document.getElementById('longBreakDuration').value = settings.longBreakDuration;
        document.getElementById('longBreakValue').textContent = settings.longBreakDuration;

        document.getElementById('cycleLength').value = settings.cycleLength;
        document.getElementById('cycleValue').textContent = settings.cycleLength;

        document.getElementById('volume').value = settings.volume;
        document.getElementById('volumeValue').textContent = settings.volume;

        // Checkboxes (with null checks)
        const autoStartEl = document.getElementById('autoStart');
        if (autoStartEl) autoStartEl.checked = settings.autoStart;

        const notificationsEl = document.getElementById('notifications');
        if (notificationsEl) notificationsEl.checked = settings.notifications;

        // Theme
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });

        // Mode


        // Audio
        document.querySelectorAll('.audio-option').forEach(option => {
            option.classList.toggle('active', option.dataset.sound === settings.soundEnd);
        });
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('hidden');
    }

    setMode(mode) {
        this.settings.set('mode', mode);
        this.settings.applyTheme();

    }



    // ============================================
    // Task Modal
    // ============================================

    showTaskModal() {
        this.populateTasks();
        this.taskModal.classList.add('active');
    }

    hideTaskModal() {
        this.taskModal.classList.remove('active');
    }

    populateTasks() {
        // Populate default tasks
        const defaultTasks = this.taskManager.getDefaultTasks();
        this.tasksGrid.innerHTML = defaultTasks.map(task => `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-icon">${task.icon}</div>
        <div class="task-name">${task.name}</div>
      </div>
    `).join('');

        // Add click listeners
        this.tasksGrid.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                this.selectTask(taskId);
            });
        });

        // Populate custom tasks
        this.populateCustomTasks();
    }

    populateCustomTasks() {
        const customTasks = this.taskManager.getCustomTasks();
        this.customTasksList.innerHTML = customTasks.map(task => `
      <div class="custom-task-item">
        <span>${task.icon} ${task.name}</span>
        <button class="btn btn-secondary btn-icon" data-delete-task="${task.id}">🗑️</button>
      </div>
    `).join('');

        // Add delete listeners
        this.customTasksList.querySelectorAll('[data-delete-task]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.deleteTask;
                this.taskManager.deleteCustomTask(taskId);
                this.populateCustomTasks();
            });
        });
    }

    selectTask(taskId) {
        this.tasksGrid.querySelectorAll('.task-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.taskId === taskId);
        });
    }

    addCustomTask() {
        const name = this.customTaskInput.value.trim();
        if (name) {
            this.taskManager.addCustomTask(name);
            this.customTaskInput.value = '';
            this.populateCustomTasks();
        }
    }

    // ============================================
    // Timer Complete Handler
    // ============================================

    handleTimerComplete(data) {
        // Play completion sound
        this.audio.setVolume(this.settings.get('volume'));
        this.audio.play(this.settings.get('soundEnd'));

        // Show notification
        if (this.settings.get('notifications')) {
            this.showNotification(data.phase);
        }
    }

    // ============================================
    // Notifications
    // ============================================

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    showNotification(phase) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const messages = {
                focus: {
                    title: '🎉 Focus Session Complete!',
                    body: 'Great job! Time for a break.'
                },
                shortBreak: {
                    title: '✨ Break Over!',
                    body: 'Ready to focus again?'
                },
                longBreak: {
                    title: '🌟 Long Break Complete!',
                    body: 'Feeling refreshed? Let\'s continue!'
                }
            };

            const notification = messages[phase] || messages.focus;
            new Notification(notification.title, {
                body: notification.body,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>'
            });
        }
    }
}

// ============================================
// Initialize App on Load
// ============================================

// Initialize App
function initApp() {
    try {
        window.app = new PomopApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('App initialization failed: ' + error.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
