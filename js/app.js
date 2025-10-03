/**
 * Email-to-Ticket Parser - Main Application
 */

// Initialize parser
const parser = new EmailParser();

// DOM Elements
const emailInput = document.getElementById('emailInput');
const parseBtn = document.getElementById('parseBtn');
const clearBtn = document.getElementById('clearBtn');
const exampleBtn = document.getElementById('exampleBtn');
const resultsSection = document.getElementById('resultsSection');
const copyJsonBtn = document.getElementById('copyJsonBtn');
const copyTextBtn = document.getElementById('copyTextBtn');

// Result display elements
const resultFrom = document.getElementById('resultFrom');
const resultSubject = document.getElementById('resultSubject');
const resultTicketId = document.getElementById('resultTicketId');
const resultCategory = document.getElementById('resultCategory');
const resultPriority = document.getElementById('resultPriority');
const resultConfidence = document.getElementById('resultConfidence');
const resultBody = document.getElementById('resultBody');
const resultInsights = document.getElementById('resultInsights');

// Validate required DOM elements exist
if (!emailInput || !parseBtn || !clearBtn || !exampleBtn || !resultsSection ||
    !copyJsonBtn || !copyTextBtn || !resultFrom || !resultSubject || !resultTicketId ||
    !resultCategory || !resultPriority || !resultConfidence || !resultBody || !resultInsights) {
    console.error('Required DOM elements not found');
    throw new Error('Failed to initialize: missing required DOM elements');
}

// Current parsed result
let currentResult = null;
let parseTimeout = null;

// Rate limiting
const rateLimiter = {
    attempts: [],
    maxAttempts: 10,
    windowMs: 60000, // 1 minute

    checkLimit() {
        const now = Date.now();
        // Remove attempts older than the window
        this.attempts = this.attempts.filter(time => now - time < this.windowMs);

        if (this.attempts.length >= this.maxAttempts) {
            return false; // Rate limit exceeded
        }

        this.attempts.push(now);
        return true; // Allow request
    }
};

// Example email
const EXAMPLE_EMAIL = `From: sarah.johnson@techcorp.com
Subject: URGENT - Cannot access shared drive

Hi Support Team,

I'm unable to access the shared marketing drive this morning. I keep getting an "Access Denied" error when I try to open it.

This is critical as I need to pull client files for a presentation in 2 hours.

I've tried:
- Restarting my computer
- Disconnecting and reconnecting to VPN
- Checking my network connection

Nothing seems to work. Can you please help ASAP?

Thanks,
Sarah Johnson
Marketing Manager`;

// Event Listeners
parseBtn.addEventListener('click', parseEmail);
clearBtn.addEventListener('click', clearForm);
exampleBtn.addEventListener('click', loadExample);
copyJsonBtn.addEventListener('click', copyAsJSON);
copyTextBtn.addEventListener('click', copyAsText);

// Allow Enter key in textarea (Ctrl+Enter to parse)
emailInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        parseEmail();
    }
});

/**
 * Parse email and display results
 */
function parseEmail() {
    const emailText = emailInput.value.trim();

    if (!emailText) {
        showError('Please paste an email to parse');
        return;
    }

    // Check rate limit
    if (!rateLimiter.checkLimit()) {
        showError('Too many requests. Please wait a moment before trying again.');
        return;
    }

    try {
        // Parse email
        currentResult = parser.parse(emailText);

        // Display results
        displayResults(currentResult);

        // Show results section with animation
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        showError('Error parsing email: ' + error.message);
    }
}

/**
 * Display parsed results
 */
function displayResults(result) {
    // Sanitize all user inputs to prevent XSS
    // Using textContent already provides protection, but validate data types
    resultFrom.textContent = sanitizeOutput(result.from);
    resultSubject.textContent = sanitizeOutput(result.subject);
    resultTicketId.textContent = sanitizeOutput(result.ticketId);

    // Classification
    resultCategory.textContent = sanitizeOutput(result.categoryLabel);
    resultCategory.className = 'value badge';

    // Validate priority is one of expected values
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const safePriority = validPriorities.includes(result.priority) ? result.priority : 'medium';
    resultPriority.textContent = safePriority.toUpperCase();
    resultPriority.className = `value badge ${safePriority}`;

    resultConfidence.textContent = `${(result.confidence * 100).toFixed(0)}%`;

    // Description
    resultBody.textContent = sanitizeOutput(result.body);

    // Insights
    resultInsights.textContent = sanitizeOutput(result.insights);
}

/**
 * Sanitize output for display
 */
function sanitizeOutput(text) {
    if (!text) return '';
    return String(text).substring(0, 10000); // Limit length to prevent DOM bloat
}

/**
 * Clear form
 */
function clearForm() {
    emailInput.value = '';
    resultsSection.style.display = 'none';
    currentResult = null;
    emailInput.focus();
}

/**
 * Load example email
 */
function loadExample() {
    emailInput.value = EXAMPLE_EMAIL;
    emailInput.focus();

    // Clear any pending parse to prevent race condition
    if (parseTimeout) {
        clearTimeout(parseTimeout);
    }

    // Auto-parse after loading
    parseTimeout = setTimeout(() => {
        parseEmail();
        parseTimeout = null;
    }, 500);
}

/**
 * Copy results as JSON
 */
function copyAsJSON() {
    if (!currentResult) {
        showError('No results to copy');
        return;
    }

    const json = parser.toJSON(currentResult);
    copyToClipboard(json, 'JSON copied to clipboard!');
}

/**
 * Copy results as plain text
 */
function copyAsText() {
    if (!currentResult) {
        showError('No results to copy');
        return;
    }

    const text = parser.toText(currentResult);
    copyToClipboard(text, 'Text copied to clipboard!');
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text, successMessage) {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccess(successMessage);
        }).catch((err) => {
            // Fallback to legacy method if clipboard API fails
            fallbackCopyToClipboard(text, successMessage);
        });
    } else {
        // Use fallback for older browsers
        fallbackCopyToClipboard(text, successMessage);
    }
}

/**
 * Fallback clipboard copy for older browsers
 */
function fallbackCopyToClipboard(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showSuccess(successMessage);
        } else {
            showError('Failed to copy to clipboard');
        }
    } catch (err) {
        showError('Failed to copy: ' + err.message);
    } finally {
        document.body.removeChild(textArea);
    }
}

/**
 * Show error message
 */
function showError(message) {
    // Sanitize error message to prevent information leakage
    const safeMessage = String(message).substring(0, 200);
    // Simple alert for now - can be enhanced with toast notifications
    alert('❌ ' + safeMessage);
}

/**
 * Show success message
 */
function showSuccess(message) {
    // Simple alert for now - can be enhanced with toast notifications
    alert('✅ ' + message);
}

// Initialize - focus on textarea
emailInput.focus();
