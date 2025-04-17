/**
 * Sanitizes a filename by removing special characters and diacritics
 * @param {string} filename - The original filename
 * @returns {string} - The sanitized filename
 */
const sanitizeFilename = (filename) => {
    // Replace spaces with underscores
    let sanitized = filename.replace(/\s+/g, '_');

    // Remove accents/diacritics
    sanitized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Replace special characters with nothing or underscore
    sanitized = sanitized.replace(/[^a-zA-Z0-9_.-]/g, '');

    // Ensure filename doesn't start with dots or dashes
    sanitized = sanitized.replace(/^[_.-]+/, '');

    return sanitized;
};

module.exports = { sanitizeFilename };
