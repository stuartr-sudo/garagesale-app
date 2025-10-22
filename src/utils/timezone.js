/**
 * Timezone utility functions for payment confirmation system
 */

/**
 * Get user's timezone from browser or default to Australia/Sydney
 * @returns {string} Timezone identifier
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney';
  } catch (error) {
    console.warn('Could not detect timezone, using default:', error);
    return 'Australia/Sydney';
  }
}

/**
 * Check if a given time is within business hours (8 AM - 10 PM)
 * @param {Date} date - The date to check
 * @param {string} timezone - The timezone to check against
 * @returns {boolean} True if within business hours
 */
export function isWithinBusinessHours(date, timezone = 'Australia/Sydney') {
  try {
    const localTime = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const hour = localTime.getHours();
    return hour >= 8 && hour < 22; // 8 AM to 10 PM
  } catch (error) {
    console.warn('Error checking business hours:', error);
    return true; // Default to business hours if error
  }
}

/**
 * Calculate confirmation deadline based on business hours
 * @param {Date} notificationTime - When the notification was sent
 * @param {string} timezone - User's timezone
 * @returns {Date} Deadline for confirmation
 */
export function calculateConfirmationDeadline(notificationTime, timezone = 'Australia/Sydney') {
  const notification = new Date(notificationTime);
  
  if (isWithinBusinessHours(notification, timezone)) {
    // Business hours: 12 hours from notification
    return new Date(notification.getTime() + (12 * 60 * 60 * 1000));
  } else {
    // Outside business hours: 24 hours from notification
    return new Date(notification.getTime() + (24 * 60 * 60 * 1000));
  }
}

/**
 * Get time remaining until deadline
 * @param {Date} deadline - The deadline date
 * @returns {Object} Time remaining object
 */
export function getTimeRemaining(deadline) {
  const now = new Date();
  const diff = new Date(deadline) - now;
  
  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    expired: false,
    hours,
    minutes,
    seconds,
    totalMinutes: Math.floor(diff / (1000 * 60))
  };
}

/**
 * Format time remaining as a readable string
 * @param {Date} deadline - The deadline date
 * @returns {string} Formatted time remaining
 */
export function formatTimeRemaining(deadline) {
  const timeRemaining = getTimeRemaining(deadline);
  
  if (timeRemaining.expired) {
    return 'Expired';
  }
  
  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`;
  } else if (timeRemaining.minutes > 0) {
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s remaining`;
  } else {
    return `${timeRemaining.seconds}s remaining`;
  }
}

/**
 * Check if deadline is approaching (less than 2 hours)
 * @param {Date} deadline - The deadline date
 * @returns {boolean} True if deadline is approaching
 */
export function isDeadlineApproaching(deadline) {
  const timeRemaining = getTimeRemaining(deadline);
  return !timeRemaining.expired && timeRemaining.totalMinutes < 120; // 2 hours
}

/**
 * Check if deadline is critical (less than 30 minutes)
 * @param {Date} deadline - The deadline date
 * @returns {boolean} True if deadline is critical
 */
export function isDeadlineCritical(deadline) {
  const timeRemaining = getTimeRemaining(deadline);
  return !timeRemaining.expired && timeRemaining.totalMinutes < 30;
}

/**
 * Format date in user's timezone
 * @param {Date} date - The date to format
 * @param {string} timezone - The timezone
 * @returns {string} Formatted date string
 */
export function formatDateInTimezone(date, timezone = 'Australia/Sydney') {
  try {
    return new Date(date).toLocaleString('en-AU', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toLocaleString();
  }
}
