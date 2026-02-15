// ============================================
// POMOP - Task Management Module
// ============================================

const DEFAULT_TASKS = [
    { id: 'stretch', name: 'Stretch & Walk', icon: '🚶' },
    { id: 'water', name: 'Drink Water', icon: '💧' },
    { id: 'eyes', name: 'Eye Exercises', icon: '👀' },
    { id: 'breathe', name: 'Deep Breathing', icon: '🫁' },
    { id: 'snack', name: 'Healthy Snack', icon: '🍎' },
    { id: 'meditate', name: 'Quick Meditation', icon: '🧘' },
    { id: 'desk', name: 'Desk Cleanup', icon: '🧹' },
    { id: 'read', name: 'Quick Read', icon: '📖' },
    { id: 'chat', name: 'Social Chat', icon: '💬' },
    { id: 'pet', name: 'Pet Time', icon: '🐕' },
    { id: 'plant', name: 'Water Plants', icon: '🌱' },
    { id: 'music', name: 'Listen to Music', icon: '🎵' }
];

export class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.customTasks = this.loadCustomTasks();
    }

    // Load default tasks
    loadTasks() {
        return [...DEFAULT_TASKS];
    }

    // Load custom tasks from localStorage
    loadCustomTasks() {
        try {
            const stored = localStorage.getItem('pomop-custom-tasks');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading custom tasks:', error);
        }
        return [];
    }

    // Save custom tasks to localStorage
    saveCustomTasks() {
        try {
            localStorage.setItem('pomop-custom-tasks', JSON.stringify(this.customTasks));
            return true;
        } catch (error) {
            console.error('Error saving custom tasks:', error);
            return false;
        }
    }

    // Get all tasks (default + custom)
    getAllTasks() {
        return [...this.tasks, ...this.customTasks];
    }

    // Get default tasks only
    getDefaultTasks() {
        return [...this.tasks];
    }

    // Get custom tasks only
    getCustomTasks() {
        return [...this.customTasks];
    }

    // Add custom task
    addCustomTask(name, icon = '✨') {
        const task = {
            id: `custom-${Date.now()}`,
            name: name.trim(),
            icon,
            custom: true
        };

        this.customTasks.push(task);
        this.saveCustomTasks();
        return task;
    }

    // Edit custom task
    editCustomTask(id, updates) {
        const index = this.customTasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.customTasks[index] = { ...this.customTasks[index], ...updates };
            this.saveCustomTasks();
            return this.customTasks[index];
        }
        return null;
    }

    // Delete custom task
    deleteCustomTask(id) {
        const index = this.customTasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.customTasks.splice(index, 1);
            this.saveCustomTasks();
            return true;
        }
        return false;
    }

    // Get random task
    getRandomTask() {
        const allTasks = this.getAllTasks();
        const randomIndex = Math.floor(Math.random() * allTasks.length);
        return allTasks[randomIndex];
    }

    // Get task by ID
    getTaskById(id) {
        const allTasks = this.getAllTasks();
        return allTasks.find(task => task.id === id);
    }
}
