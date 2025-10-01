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

// Current parsed result
let currentResult = null;

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
    // Basic info
    resultFrom.textContent = result.from;
    resultSubject.textContent = result.subject;
    resultTicketId.textContent = result.ticketId;

    // Classification
    resultCategory.textContent = result.categoryLabel;
    resultCategory.className = 'value badge';

    resultPriority.textContent = result.priority.toUpperCase();
    resultPriority.className = `value badge ${result.priority}`;

    resultConfidence.textContent = `${(result.confidence * 100).toFixed(0)}%`;

    // Description
    resultBody.textContent = result.body;

    // Insights
    resultInsights.textContent = result.insights;
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
    // Auto-parse after loading
    setTimeout(parseEmail, 500);
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
    navigator.clipboard.writeText(text).then(() => {
        showSuccess(successMessage);
    }).catch((err) => {
        showError('Failed to copy: ' + err.message);
    });
}

/**
 * Show error message
 */
function showError(message) {
    // Simple alert for now - can be enhanced with toast notifications
    alert('❌ ' + message);
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
