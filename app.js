// ============================================
// POMOP - Main Application
// ============================================

import { Timer } from './modules/timer.js';
import { Settings } from './modules/settings.js';
import { TaskManager } from './modules/tasks.js';
import { AudioManager } from './modules/audio.js';

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

        // UI Elements
        this.initializeElements();

        // Initialize timer with settings
        this.timer.init(this.settings.getAll());

        // Set up event listeners
        this.setupTimerListeners();
        this.setupUIListeners();
        this.setupSettingsListeners();
        this.setupTaskListeners();

        // Apply theme
        this.settings.applyTheme();

        // Load settings into UI
        this.loadSettingsToUI();

        // Request notification permission
        this.requestNotificationPermission();

        // Update UI
        this.updateUI();
    }

    initializeElements() {
        // Timer elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.phaseLabel = document.getElementById('phaseLabel');
        this.cycleIndicator = document.getElementById('cycleIndicator');
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

        this.timer.on('reset', () => {
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
                }

                // Update volume
                if (key === 'volume') {
                    this.audio.setVolume(value);
                }
            });
        });

        // Auto-start checkbox
        document.getElementById('autoStart').addEventListener('change', (e) => {
            this.settings.set('autoStart', e.target.checked);
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

        // Mode toggle
        document.getElementById('lightModeBtn').addEventListener('click', () => {
            this.setMode('light');
        });

        document.getElementById('darkModeBtn').addEventListener('click', () => {
            this.setMode('dark');
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
    // UI Updates
    // ============================================

    updateTimerDisplay(data) {
        const minutes = Math.floor(data.timeRemaining / 60);
        const seconds = data.timeRemaining % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        this.timerDisplay.textContent = formatted;

        // Update circular progress
        const circumference = 879.6; // 2 * π * 140
        const offset = circumference - (data.progress / 100) * circumference;
        this.timerProgress.style.strokeDashoffset = offset;

        // Update glow fill based on progress
        // Focus: depletes (shrinks) as time runs out
        // Breaks: fills up (grows) as you rest
        if (this.timerGlow) {
            const minScale = 0.5;
            const maxScale = 1.2;
            const minOpacity = 0.15;
            const maxOpacity = 0.45;

            // Determine if this is a break phase
            const isBreak = data.phase === 'shortBreak' || data.phase === 'longBreak';

            let scale, opacity;
            if (isBreak) {
                // During breaks: fill UP as timer counts down (progress increases)
                scale = minScale + (data.progress / 100) * (maxScale - minScale);
                opacity = minOpacity + (data.progress / 100) * (maxOpacity - minOpacity);
            } else {
                // During focus: fill DOWN as timer counts down (inverse of progress)
                const inverseProgress = 100 - data.progress;
                scale = minScale + (inverseProgress / 100) * (maxScale - minScale);
                opacity = minOpacity + (inverseProgress / 100) * (maxOpacity - minOpacity);
            }

            this.timerGlow.style.transform = `scale(${scale})`;
            this.timerGlow.style.opacity = opacity;
        }

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
        const colors = {
            focus: 'var(--timer-focus)',
            shortBreak: 'var(--timer-break)',
            longBreak: 'var(--timer-long-break)'
        };

        this.timerProgress.style.stroke = colors[data.phase] || colors.focus;
    }

    updateCycleIndicator(data) {
        const cycleLength = this.settings.get('cycleLength');
        this.cycleIndicator.textContent = `Pomodoro ${data.cycle} of ${cycleLength}`;
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

        // Checkboxes
        document.getElementById('autoStart').checked = settings.autoStart;
        document.getElementById('notifications').checked = settings.notifications;

        // Theme
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });

        // Mode
        this.setModeButtons(settings.mode);

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
        this.setModeButtons(mode);
    }

    setModeButtons(mode) {
        document.getElementById('lightModeBtn').classList.toggle('active', mode === 'light');
        document.getElementById('darkModeBtn').classList.toggle('active', mode === 'dark');
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

const initApp = () => {
    window.pomopApp = new PomopApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
