/**
 * Event Throttler - Prevents excessive socket emissions
 * Uses a time-based throttling strategy to avoid flooding clients
 */

class EventThrottler {
  constructor() {
    // Store last emission time for each event type
    this.lastEmission = new Map();
    
    // Throttle intervals (in milliseconds)
    this.throttleIntervals = {
      'analytics:live_stats': 5000,        // 5 seconds
      'analytics:search': 2000,            // 2 seconds
      'analytics:craft_view': 2000,        // 2 seconds
      'analytics:product_view': 2000,      // 2 seconds
      default: 1000,                       // 1 second default
    };
    
    // Pending events that need to be emitted after throttle period
    this.pendingEvents = new Map();
    
    // Timers for delayed emissions
    this.timers = new Map();
  }

  /**
   * Check if an event should be emitted based on throttle rules
   * @param {String} eventType - Type of event to check
   * @returns {Boolean} True if event should be emitted
   */
  shouldEmit(eventType) {
    const now = Date.now();
    const lastTime = this.lastEmission.get(eventType) || 0;
    const interval = this.throttleIntervals[eventType] || this.throttleIntervals.default;
    
    return (now - lastTime) >= interval;
  }

  /**
   * Record that an event was emitted
   * @param {String} eventType - Type of event that was emitted
   */
  recordEmission(eventType) {
    this.lastEmission.set(eventType, Date.now());
  }

  /**
   * Throttle an event emission
   * @param {String} eventType - Type of event
   * @param {Function} emitFn - Function to call to emit the event
   * @param {Object} data - Data to emit
   * @returns {Boolean} True if event was emitted immediately
   */
  throttle(eventType, emitFn, data) {
    if (this.shouldEmit(eventType)) {
      // Emit immediately
      emitFn(data);
      this.recordEmission(eventType);
      
      // Clear any pending event of this type
      this.clearPending(eventType);
      
      console.log(`[THROTTLER] ✅ Emitted ${eventType} immediately`);
      return true;
    } else {
      // Queue event for later emission
      this.queueEvent(eventType, emitFn, data);
      console.log(`[THROTTLER] ⏳ Queued ${eventType} for delayed emission`);
      return false;
    }
  }

  /**
   * Queue an event for delayed emission
   * @param {String} eventType - Type of event
   * @param {Function} emitFn - Function to call to emit the event
   * @param {Object} data - Data to emit
   */
  queueEvent(eventType, emitFn, data) {
    // Update pending event with latest data
    this.pendingEvents.set(eventType, { emitFn, data });
    
    // Clear existing timer if any
    if (this.timers.has(eventType)) {
      clearTimeout(this.timers.get(eventType));
    }
    
    // Calculate time until next allowed emission
    const now = Date.now();
    const lastTime = this.lastEmission.get(eventType) || 0;
    const interval = this.throttleIntervals[eventType] || this.throttleIntervals.default;
    const timeUntilEmit = Math.max(0, interval - (now - lastTime));
    
    // Set timer to emit after throttle period
    const timer = setTimeout(() => {
      const pending = this.pendingEvents.get(eventType);
      if (pending) {
        pending.emitFn(pending.data);
        this.recordEmission(eventType);
        this.pendingEvents.delete(eventType);
      }
      this.timers.delete(eventType);
    }, timeUntilEmit);
    
    this.timers.set(eventType, timer);
  }

  /**
   * Clear a pending event
   * @param {String} eventType - Type of event to clear
   */
  clearPending(eventType) {
    if (this.timers.has(eventType)) {
      clearTimeout(this.timers.get(eventType));
      this.timers.delete(eventType);
    }
    this.pendingEvents.delete(eventType);
  }

  /**
   * Get throttle statistics
   * @returns {Object} Statistics about throttling
   */
  getStats() {
    return {
      activeEvents: this.lastEmission.size,
      pendingEvents: this.pendingEvents.size,
      activeTimers: this.timers.size,
      intervals: this.throttleIntervals,
    };
  }

  /**
   * Reset all throttle state
   */
  reset() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.lastEmission.clear();
    this.pendingEvents.clear();
    this.timers.clear();
  }

  /**
   * Update throttle interval for an event type
   * @param {String} eventType - Type of event
   * @param {Number} interval - New interval in milliseconds
   */
  setInterval(eventType, interval) {
    if (interval < 0) {
      throw new Error('Interval must be positive');
    }
    this.throttleIntervals[eventType] = interval;
  }
}

// Singleton instance
const eventThrottler = new EventThrottler();

module.exports = eventThrottler;
