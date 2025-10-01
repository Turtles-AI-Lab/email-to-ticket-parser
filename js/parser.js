/**
 * Email-to-Ticket Parser
 * Extracts ticket information from support emails
 */

class EmailParser {
    constructor() {
        // Simplified ticket categories based on common patterns
        this.categories = {
            password_reset: {
                keywords: ['password', 'forgot', 'reset', 'unlock', 'locked out', 'can\'t login', 'cannot login'],
                priority: 'high'
            },
            email_issue: {
                keywords: ['email', 'outlook', 'can\'t send', 'cannot receive', 'inbox', 'spam'],
                priority: 'medium'
            },
            printer_issue: {
                keywords: ['printer', 'print', 'printing', 'queue', 'spooler', 'jam', 'toner'],
                priority: 'medium'
            },
            network_issue: {
                keywords: ['network', 'internet', 'wifi', 'vpn', 'connection', 'ethernet', 'offline'],
                priority: 'high'
            },
            software_install: {
                keywords: ['install', 'software', 'application', 'program', 'download', 'setup'],
                priority: 'low'
            },
            access_request: {
                keywords: ['access', 'permission', 'share', 'folder', 'drive', 'cannot access', 'denied'],
                priority: 'medium'
            },
            hardware_issue: {
                keywords: ['laptop', 'computer', 'monitor', 'keyboard', 'mouse', 'broken', 'not working'],
                priority: 'medium'
            },
            performance_issue: {
                keywords: ['slow', 'frozen', 'crash', 'not responding', 'hang', 'lag', 'freeze'],
                priority: 'medium'
            }
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
        if (!emailText || emailText.trim().length === 0) {
            throw new Error('Email text cannot be empty');
        }
        if (emailText.length > 100000) {
            throw new Error('Email text too large (max 100KB)');
        }

        const from = this.extractFrom(emailText);
        const subject = this.extractSubject(emailText);
        const body = this.extractBody(emailText);
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
    }

    /**
     * Extract sender email
     */
    extractFrom(text) {
        // Try various email patterns (RFC-compliant)
        const patterns = [
            /From:\s*([^\n<]+(?:<[^>]+>)?)/i,
            /Sender:\s*([^\n<]+(?:<[^>]+>)?)/i,
            /([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)/
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
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

        // Remove common email signatures (with limited lookahead to prevent ReDoS)
        const withoutSignature = body
            .replace(/--\s*\n[\s\S]{0,1000}?$/, '')  // -- signature (limited)
            .replace(/Best regards[\s\S]{0,500}?$/i, '')  // Limited with non-greedy
            .replace(/Thanks[\s\S]{0,500}?$/i, '')
            .replace(/Sent from my [\s\S]{0,200}?$/i, '');

        return withoutSignature.trim() || body;
    }

    /**
     * Classify issue based on keywords
     */
    classifyIssue(text) {
        const lowerText = text.toLowerCase();
        let bestMatch = { name: 'other', confidence: 0, priority: 'medium' };
        let maxScore = 0;

        for (const [categoryName, category] of Object.entries(this.categories)) {
            let score = 0;
            let matches = 0;

            for (const keyword of category.keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    matches++;
                    score += 1;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = {
                    name: categoryName,
                    confidence: Math.min(matches * 0.15, 1.0),  // Cap at 1.0
                    priority: category.priority
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
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Format category name for display
     */
    formatCategoryName(name) {
        // Sanitize to prevent XSS
        const sanitized = name.replace(/[<>&"']/g, '');
        return sanitized
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Generate AI insights
     */
    generateInsights(category, priority, body) {
        const insights = [];

        if (category.name !== 'other') {
            insights.push(`✓ Automatically categorized as "${this.formatCategoryName(category.name)}" with ${(category.confidence * 100).toFixed(0)}% confidence`);
        }

        if (priority === 'urgent') {
            insights.push('⚠️ Marked as URGENT - detected urgency indicators in message');
        }

        const bodyLength = body.length;
        if (bodyLength < 50) {
            insights.push('ℹ️ Very brief message - may need follow-up for more details');
        } else if (bodyLength > 500) {
            insights.push('ℹ️ Detailed message - user provided comprehensive information');
        }

        if (category.name === 'password_reset') {
            insights.push('💡 Suggestion: This can often be auto-resolved with a password reset link');
        } else if (category.name === 'software_install') {
            insights.push('💡 Suggestion: Check if user has admin rights before proceeding');
        } else if (category.name === 'network_issue') {
            insights.push('💡 Suggestion: Ask user to check physical connections and restart router');
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
        return `
TICKET INFORMATION
==================

Ticket ID:    ${parsed.ticketId}
From:         ${parsed.from}
Subject:      ${parsed.subject}
Category:     ${parsed.categoryLabel}
Priority:     ${parsed.priority.toUpperCase()}
Confidence:   ${(parsed.confidence * 100).toFixed(0)}%
Created:      ${new Date(parsed.timestamp).toLocaleString()}

DESCRIPTION
-----------
${parsed.body}

INSIGHTS
--------
${parsed.insights}
        `.trim();
    }
}

// Export for use in app.js
window.EmailParser = EmailParser;
