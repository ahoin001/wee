class IntervalManager {
  constructor() {
    this.masterInterval = null;
    this.tasks = new Map(); // Map of task IDs to their functions
    this.lastRunTimes = new Map(); // Track when each task last ran
    this.intervalMs = 1000; // Master interval runs every 1 second instead of 100ms
    this.taskIdCounter = 0;
  }

  // Add a task to be executed at specified intervals
  addTask(taskFn, intervalMs, taskName = '') {
    const taskId = this.taskIdCounter++;
    this.tasks.set(taskId, {
      fn: taskFn,
      intervalMs: intervalMs,
      name: taskName,
      lastRun: 0
    });
    
    // Start master interval if not already running
    if (!this.masterInterval) {
      this.startMasterInterval();
    }
    
    return taskId;
  }

  // Remove a task
  removeTask(taskId) {
    this.tasks.delete(taskId);
    
    // Stop master interval if no tasks remain
    if (this.tasks.size === 0 && this.masterInterval) {
      this.stopMasterInterval();
    }
  }

  // Start the master interval
  startMasterInterval() {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
    }
    
    this.masterInterval = setInterval(() => {
      const now = Date.now();
      
      this.tasks.forEach((task, taskId) => {
        if (now - task.lastRun >= task.intervalMs) {
          try {
            task.fn();
            task.lastRun = now;
          } catch (error) {
            console.error(`Error in interval task "${task.name}":`, error);
          }
        }
      });
    }, this.intervalMs);
  }

  // Stop the master interval
  stopMasterInterval() {
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
    }
  }

  // Update interval frequency (useful for performance tuning)
  setIntervalMs(ms) {
    this.intervalMs = ms;
    if (this.masterInterval) {
      this.startMasterInterval(); // Restart with new interval
    }
  }

  // Get current task count
  getTaskCount() {
    return this.tasks.size;
  }

  // Get task info for debugging
  getTaskInfo() {
    return Array.from(this.tasks.entries()).map(([id, task]) => ({
      id,
      name: task.name,
      intervalMs: task.intervalMs,
      lastRun: task.lastRun
    }));
  }

  // Cleanup all tasks and stop interval
  cleanup() {
    this.tasks.clear();
    this.stopMasterInterval();
  }
}

// Create singleton instance
const intervalManager = new IntervalManager();

export default intervalManager; 