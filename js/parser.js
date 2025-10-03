/**
 * Email-to-Ticket Parser
 * Extracts ticket information from support emails
 */

class EmailParser {
    constructor() {
        // Simplified ticket categories based on common patterns
        // Use Object.create(null) to prevent prototype pollution
        this.categories = Object.create(null);
        this.categories.password_reset = {
            keywords: ['password', 'forgot', 'reset', 'unlock', 'locked out', 'can\'t login', 'cannot login'],
            priority: 'high'
        };
        this.categories.email_issue = {
            keywords: ['email', 'outlook', 'can\'t send', 'cannot receive', 'inbox', 'spam'],
            priority: 'medium'
        };
        this.categories.printer_issue = {
            keywords: ['printer', 'print', 'printing', 'queue', 'spooler', 'jam', 'toner'],
            priority: 'medium'
        };
        this.categories.network_issue = {
            keywords: ['network', 'internet', 'wifi', 'vpn', 'connection', 'ethernet', 'offline'],
            priority: 'high'
        };
        this.categories.software_install = {
            keywords: ['install', 'software', 'application', 'program', 'download', 'setup'],
            priority: 'low'
        };
        this.categories.access_request = {
            keywords: ['access', 'permission', 'share', 'folder', 'drive', 'cannot access', 'denied'],
            priority: 'medium'
        };
        this.categories.hardware_issue = {
            keywords: ['laptop', 'computer', 'monitor', 'keyboard', 'mouse', 'broken', 'not working'],
            priority: 'medium'
        };
        this.categories.performance_issue = {
            keywords: ['slow', 'frozen', 'crash', 'not responding', 'hang', 'lag', 'freeze'],
            priority: 'medium'
        };

        this.urgencyKeywords = [
            'urgent', 'asap', 'emergency', 'critical', 'immediately', 'right now',
            'down', 'broken', 'can\'t work', 'cannot work', 'production'
        ];
    }

    /**
     * Main parsing function
     */
    parse(emailText) {
        try {
            // Validate input
            if (!emailText || typeof emailText !== 'string') {
                throw new Error('Email text must be a non-empty string');
            }

            const trimmedText = emailText.trim();
            if (trimmedText.length === 0) {
                throw new Error('Email text cannot be empty');
            }
            if (trimmedText.length > 100000) {
                throw new Error('Email text too large (max 100KB)');
            }

            // Extract components with error handling
            const from = this.extractFrom(trimmedText);
            const subject = this.extractSubject(trimmedText);
            const body = this.extractBody(trimmedText);

            // Validate extracted data
            if (!body || body.length === 0) {
                throw new Error('Could not extract email body');
            }

            const category = this.classifyIssue(subject + ' ' + body);
            const priority = this.determinePriority(subject + ' ' + body, category);
            const ticketId = this.generateTicketId();
            const insights = this.generateInsights(category, priority, body);

            return {
                ticketId,
                from,
                subject,
                body,
                category: category.name,
                categoryLabel: this.formatCategoryName(category.name),
                priority,
                confidence: category.confidence,
                timestamp: new Date().toISOString(),
                insights
            };
        } catch (error) {
            // Re-throw with sanitized error message
            if (error.message && error.message.length > 200) {
                throw new Error('Error parsing email: Invalid format');
            }
            throw error;
        }
    }

    /**
     * Extract sender email
     */
    extractFrom(text) {
        // Limit text length to prevent ReDoS
        const limitedText = text.substring(0, 2000);

        // Try various email patterns (optimized to prevent ReDoS)
        const patterns = [
            /From:\s*([^\n<]+(?:<[^>]+>)?)/i,
            /Sender:\s*([^\n<]+(?:<[^>]+>)?)/i,
            // Simplified email pattern to prevent ReDoS - non-backtracking
            /([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?){0,10})/
        ];

        for (const pattern of patterns) {
            const match = limitedText.match(pattern);
            if (match) {
                return match[1] ? match[1].trim() : match[0].trim();
            }
        }

        return 'Unknown Sender';
    }

    /**
     * Extract email subject
     */
    extractSubject(text) {
        const subjectMatch = text.match(/Subject:\s*([^\n]+)/i);
        if (subjectMatch) {
            return subjectMatch[1].trim();
        }

        // Try to extract from first line if no "Subject:" found
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // If first line is not From/To/Subject header, treat it as subject
            if (!/^(from|to|subject|sender|date):/i.test(firstLine)) {
                return firstLine;
            }
        }

        return 'No Subject';
    }

    /**
     * Extract email body
     */
    extractBody(text) {
        // Remove header lines
        const lines = text.split('\n');
        let bodyStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip header lines
            if (/^(from|to|subject|sender|date|cc|bcc):/i.test(line)) {
                continue;
            }
            // First non-header line starts the body
            if (line.length > 0) {
                bodyStart = i;
                break;
            }
        }

        const body = lines.slice(bodyStart).join('\n').trim();

        // Remove common email signatures (optimized to prevent ReDoS)
        // Use simple string operations instead of complex regex when possible
        let withoutSignature = body;

        // Find and remove signature markers
        const signatureMarker = withoutSignature.indexOf('\n--');
        if (signatureMarker !== -1) {
            withoutSignature = withoutSignature.substring(0, signatureMarker);
        }

        // Remove common sign-offs (use non-greedy with strict limits)
        const signOffs = [
            /Best regards[^\n]{0,100}\n[\s\S]{0,300}$/i,
            /Thanks[^\n]{0,100}\n[\s\S]{0,300}$/i,
            /Sent from my [^\n]{0,100}$/i,
            /Regards[^\n]{0,100}\n[\s\S]{0,200}$/i
        ];

        for (const pattern of signOffs) {
            withoutSignature = withoutSignature.replace(pattern, '');
        }

        return withoutSignature.trim() || body;
    }

    /**
     * Classify issue based on keywords
     */
    classifyIssue(text) {
        // Validate and sanitize input
        if (!text || typeof text !== 'string') {
            return { name: 'other', confidence: 0, priority: 'medium' };
        }

        // Limit text length for performance
        const limitedText = text.substring(0, 5000);
        const lowerText = limitedText.toLowerCase();

        let bestMatch = { name: 'other', confidence: 0, priority: 'medium' };
        let maxScore = 0;

        for (const [categoryName, category] of Object.entries(this.categories)) {
            // Skip if category is invalid
            if (!category || !Array.isArray(category.keywords)) {
                continue;
            }

            let score = 0;
            let matches = 0;

            for (const keyword of category.keywords) {
                if (typeof keyword === 'string' && lowerText.includes(keyword.toLowerCase())) {
                    matches++;
                    score += 1;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = {
                    name: categoryName,
                    confidence: Math.min(matches * 0.15, 1.0),  // Cap at 1.0
                    priority: category.priority || 'medium'
                };
            }
        }

        // If no good match, set low confidence
        if (bestMatch.confidence < 0.25) {
            bestMatch = { name: 'other', confidence: 0.15, priority: 'medium' };
        }

        return bestMatch;
    }

    /**
     * Determine priority based on urgency keywords and category
     */
    determinePriority(text, category) {
        const lowerText = text.toLowerCase();

        // Check for urgency keywords
        const hasUrgency = this.urgencyKeywords.some(keyword =>
            lowerText.includes(keyword.toLowerCase())
        );

        if (hasUrgency) {
            return 'urgent';
        }

        return category.priority || 'medium';
    }

    /**
     * Generate unique ticket ID
     */
    generateTicketId() {
        const prefix = 'TKT';
        const timestamp = Date.now().toString(36).toUpperCase();

        // Use crypto.getRandomValues for cryptographically secure random
        let random;
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            random = array[0].toString(36).substring(0, 6).toUpperCase();
        } else {
            // Fallback for older browsers (less secure but better than Math.random)
            random = Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Format category name for display
     */
    formatCategoryName(name) {
        // Sanitize to prevent XSS - properly escape HTML entities
        const sanitized = String(name).replace(/[<>&"']/g, (char) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return entities[char];
        });
        return sanitized
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Sanitize text to prevent XSS
     */
    sanitizeText(text) {
        if (!text) return '';
        return String(text).replace(/[<>&"']/g, (char) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return entities[char];
        });
    }

    /**
     * Generate AI insights
     */
    generateInsights(category, priority, body) {
        const insights = [];

        // Sanitize category name to prevent XSS
        const safeCategoryName = this.formatCategoryName(category.name);
        const safeConfidence = Math.max(0, Math.min(100, (category.confidence * 100))).toFixed(0);

        if (category.name !== 'other') {
            insights.push(`✓ Automatically categorized as "${safeCategoryName}" with ${safeConfidence}% confidence`);
        }

        if (priority === 'urgent') {
            insights.push('⚠️ Marked as URGENT - detected urgency indicators in message');
        }

        const bodyLength = typeof body === 'string' ? body.length : 0;
        if (bodyLength < 50) {
            insights.push('ℹ️ Very brief message - may need follow-up for more details');
        } else if (bodyLength > 500) {
            insights.push('ℹ️ Detailed message - user provided comprehensive information');
        }

        // Only add suggestions for known safe categories
        const validCategories = ['password_reset', 'software_install', 'network_issue', 'email_issue', 'printer_issue', 'access_request', 'hardware_issue', 'performance_issue'];
        if (validCategories.includes(category.name)) {
            if (category.name === 'password_reset') {
                insights.push('💡 Suggestion: This can often be auto-resolved with a password reset link');
            } else if (category.name === 'software_install') {
                insights.push('💡 Suggestion: Check if user has admin rights before proceeding');
            } else if (category.name === 'network_issue') {
                insights.push('💡 Suggestion: Ask user to check physical connections and restart router');
            }
        }

        return insights.length > 0 ? insights.join('\n') : 'No additional insights available';
    }

    /**
     * Export as JSON
     */
    toJSON(parsed) {
        return JSON.stringify(parsed, null, 2);
    }

    /**
     * Export as plain text
     */
    toText(parsed) {
        // Sanitize all fields to prevent any injection in plain text exports
        const safeTicketId = String(parsed.ticketId || '').substring(0, 100);
        const safeFrom = String(parsed.from || '').substring(0, 200);
        const safeSubject = String(parsed.subject || '').substring(0, 500);
        const safeCategoryLabel = String(parsed.categoryLabel || '').substring(0, 100);
        const safePriority = String(parsed.priority || 'medium').substring(0, 20).toUpperCase();
        const safeConfidence = (parsed.confidence * 100).toFixed(0);
        const safeTimestamp = parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : 'Unknown';
        const safeBody = String(parsed.body || '').substring(0, 10000);
        const safeInsights = String(parsed.insights || '').substring(0, 2000);

        return `
TICKET INFORMATION
==================

Ticket ID:    ${safeTicketId}
From:         ${safeFrom}
Subject:      ${safeSubject}
Category:     ${safeCategoryLabel}
Priority:     ${safePriority}
Confidence:   ${safeConfidence}%
Created:      ${safeTimestamp}

DESCRIPTION
-----------
${safeBody}

INSIGHTS
--------
${safeInsights}
        `.trim();
    }
}

// Export for use in app.js
window.EmailParser = EmailParser;
