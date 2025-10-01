# Security Policy

## Recent Security Fixes

### Version 1.0.1 (October 1, 2025)

**Critical Fixes:**
- ✅ Added input size validation (max 100KB) to prevent DoS attacks
- ✅ Fixed ReDoS vulnerabilities in signature removal regex patterns
- ✅ Sanitized category names to prevent XSS attacks
- ✅ Implemented RFC-compliant email regex pattern
- ✅ Added DOM element validation to prevent null reference errors
- ✅ Fixed race condition in example loading

## Reporting a Vulnerability

If you discover a security vulnerability, please email: jgreenia@jandraisolutions.com

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will respond within 48 hours and aim to release a fix within 7 days for critical issues.

## Security Best Practices

When using this tool:
1. ✅ Validate all user input before processing
2. ✅ Do not paste sensitive credentials or passwords into emails
3. ✅ Use HTTPS when deploying to production
4. ✅ Keep dependencies up to date (currently zero dependencies)
5. ✅ Review the code before deploying in security-sensitive environments

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |
