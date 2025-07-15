/**
 * Timezone utilities for EST conversion
 */

/**
 * Convert UTC timestamp to EST
 * @param {string|Date} utcDate - UTC date string or Date object
 * @returns {Date} EST date object
 */
export const convertUTCToEST = (utcDate) => {
    const date = new Date(utcDate);
    // EST is UTC-5
    return new Date(date.getTime() - (5 * 60 * 60 * 1000));
};

/**
 * Convert EST timestamp to UTC
 * @param {string|Date} estDate - EST date string or Date object
 * @returns {Date} UTC date object
 */
export const convertESTToUTC = (estDate) => {
    const date = new Date(estDate);
    // EST is UTC-5, so UTC is EST+5
    return new Date(date.getTime() + (5 * 60 * 60 * 1000));
};

/**
 * Format date for EST display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string in EST
 */
export const formatESTDateTime = (date) => {
    const estDate = convertUTCToEST(date);
    return estDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Format date for EST display (date only)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string in EST
 */
export const formatESTDate = (date) => {
    const estDate = convertUTCToEST(date);
    return estDate.toLocaleDateString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * Format time for EST display (time only)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string in EST
 */
export const formatESTTime = (date) => {
    const estDate = convertUTCToEST(date);
    return estDate.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Convert datetime-local input value to EST ISO string
 * @param {string} datetimeLocalValue - Value from datetime-local input
 * @returns {string} EST ISO string
 */
export const datetimeLocalToESTISO = (datetimeLocalValue) => {
    if (!datetimeLocalValue) return null;
    
    // datetime-local inputs are in local timezone, so we need to convert to EST
    const localDate = new Date(datetimeLocalValue);
    
    // Get the timezone offset in minutes
    const timezoneOffset = localDate.getTimezoneOffset();
    
    // Adjust for EST (UTC-5)
    const estOffset = 5 * 60; // 5 hours in minutes
    const totalOffset = timezoneOffset + estOffset;
    
    // Create EST date
    const estDate = new Date(localDate.getTime() + (totalOffset * 60 * 1000));
    
    return estDate.toISOString();
};

/**
 * Get current time in EST
 * @returns {Date} Current EST time
 */
export const getCurrentEST = () => {
    return convertUTCToEST(new Date());
};

/**
 * Check if two dates are the same day in EST
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day in EST
 */
export const isSameDayEST = (date1, date2) => {
    const estDate1 = convertUTCToEST(date1);
    const estDate2 = convertUTCToEST(date2);
    
    return estDate1.toDateString() === estDate2.toDateString();
}; 