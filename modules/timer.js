// ============================================
// POMOP - Timer Engine Module
// ============================================

export class Timer {
  constructor() {
    this.state = 'idle'; // idle, running, paused
    this.phase = 'focus'; // focus, shortBreak, longBreak
    this.timeRemaining = 0;
    this.totalTime = 0;
    this.pomodorosCompleted = 0;
    this.currentCycle = 0;
    this.intervalId = null;
    this.listeners = {};
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

  // Initialize timer with settings
  init(settings) {
    this.settings = settings;
    this.setPhase('focus');
  }

  // Set current phase
  setPhase(phase) {
    this.phase = phase;

    switch (phase) {
      case 'focus':
        this.totalTime = this.settings.focusDuration * 60;
        break;
      case 'shortBreak':
        this.totalTime = this.settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        this.totalTime = this.settings.longBreakDuration * 60;
        break;
    }

    this.timeRemaining = this.totalTime;
    this.emit('phaseChange', { phase, timeRemaining: this.timeRemaining, totalTime: this.totalTime });
  }

  // Start timer
  start() {
    if (this.state === 'running') return;

    // If timer finished and user clicks start, move to next phase
    if (this.timeRemaining === 0) {
      this.nextPhase();
    }

    this.state = 'running';
    this.emit('start', { phase: this.phase });

    // Use setInterval for countdown
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  // Pause timer
  pause() {
    if (this.state !== 'running') return;

    this.state = 'paused';
    this.emit('pause', { phase: this.phase, timeRemaining: this.timeRemaining });

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Reset timer
  reset() {
    this.pause();
    this.state = 'idle';
    this.timeRemaining = this.totalTime;
    this.emit('reset', {
      phase: this.phase,
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      progress: 0
    });
  }

  // Skip to next phase
  skip() {
    this.pause();
    this.nextPhase();
  }

  // Timer tick
  tick() {
    if (this.timeRemaining > 0) {
      this.timeRemaining--;
      this.emit('tick', {
        phase: this.phase,
        timeRemaining: this.timeRemaining,
        totalTime: this.totalTime,
        progress: ((this.totalTime - this.timeRemaining) / this.totalTime) * 100
      });
    } else {
      // Timer completed
      this.handlePhaseComplete();
    }
  }

  // Handle phase completion
  handlePhaseComplete() {
    this.pause();
    this.emit('complete', { phase: this.phase });

    // Update pomodoro count if focus phase completed
    if (this.phase === 'focus') {
      this.pomodorosCompleted++;
      this.currentCycle++;
      this.emit('pomodoroComplete', {
        count: this.pomodorosCompleted,
        cycle: this.currentCycle
      });
    }

    // Auto-advance to next phase if enabled
    if (this.settings.autoStart) {
      setTimeout(() => {
        this.nextPhase();
        this.start();
      }, 1000);
    }
  }

  // Advance to next phase
  nextPhase() {
    if (this.phase === 'focus') {
      // Check if it's time for long break
      if (this.currentCycle >= this.settings.cycleLength) {
        this.setPhase('longBreak');
        this.currentCycle = 0;
        this.emit('longBreakTime', {});
      } else {
        this.setPhase('shortBreak');
      }
    } else {
      // After any break, go back to focus
      this.setPhase('focus');
    }
  }

  // Get formatted time
  getFormattedTime() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Get progress percentage
  getProgress() {
    return ((this.totalTime - this.timeRemaining) / this.totalTime) * 100;
  }

  // Get state
  getState() {
    return {
      state: this.state,
      phase: this.phase,
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      pomodorosCompleted: this.pomodorosCompleted,
      currentCycle: this.currentCycle,
      formattedTime: this.getFormattedTime(),
      progress: this.getProgress()
    };
  }
}
