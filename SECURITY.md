# Security Policy

## 🔒 Security Overview

Storyboard AI is designed with security and privacy as core principles. This document outlines our security practices and how to report security issues.

## 🛡️ Security Features

### Client-Side Architecture
- **No Server Dependencies**: All processing happens in your browser
- **Local Data Storage**: Projects stored in browser localStorage only
- **No Data Transmission**: Your storyboards never leave your device
- **API Key Security**: OpenAI keys stored locally, never transmitted to our servers

### Data Protection
- **Privacy by Design**: No user tracking or analytics
- **No External Dependencies**: Minimal third-party integrations
- **Secure Storage**: Browser localStorage with proper error handling
- **No Cookies**: No tracking cookies or session management

### Content Security
- **XSS Protection**: Proper input sanitization and content escaping
- **Safe Rendering**: React's built-in XSS protections
- **Secure Dependencies**: Regular dependency updates and vulnerability scanning
- **Type Safety**: TypeScript for compile-time error prevention

## 🔑 OpenAI API Key Security

### Best Practices
- **Local Storage Only**: API keys are stored in browser localStorage
- **User Control**: You can delete your key anytime
- **No Transmission**: Keys never sent to our servers
- **Direct Communication**: Direct browser-to-OpenAI API calls only

### Recommendations
- Use a dedicated API key for this application
- Monitor your OpenAI usage regularly
- Delete the key from the app when not in use
- Never share your API key publicly

## 📊 Data Handling

### What We Store Locally
- Storyboard projects and panels
- User preferences and settings
- OpenAI API key (encrypted in localStorage)
- AI conversation history (optional)

### What We DON'T Collect
- Personal information
- Analytics data
- Usage tracking
- Error reporting to external services

## 🚨 Reporting Security Issues

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes            |

### How to Report

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. **Do** use GitHub's Security Advisory feature:
   - Go to the repository
   - Click "Security" tab
   - Click "Report a vulnerability"
3. **Include** as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution**: Depends on severity and complexity

## 🔍 Security Auditing

### Self-Auditing
You can verify our security claims:
- **Source Code**: Fully open source on GitHub
- **Build Process**: Transparent GitHub Actions
- **Dependencies**: Listed in package.json
- **No Hidden Code**: Everything is visible

### Third-Party Security
- **OpenAI API**: Uses official OpenAI JavaScript SDK
- **React**: Uses official React framework
- **Vite**: Uses official Vite build tool
- **Dependencies**: Minimal and well-maintained packages

## 🛠️ Security Recommendations for Users

### Browser Security
- Use a modern, updated browser
- Enable JavaScript security features
- Consider using private/incognito mode for sensitive work
- Clear browser data regularly if sharing devices

### API Key Management
- Use API keys with minimum required permissions
- Monitor OpenAI usage dashboard
- Rotate keys periodically
- Delete keys from the app when finished

### Project Security
- Export important projects regularly
- Use secure networks when working online
- Verify project contents before importing

## 📜 Compliance

### Standards
- **OWASP Top 10**: Mitigations implemented
- **Web Security**: Following web security best practices
- **Privacy Laws**: No data collection = no compliance issues
- **Accessibility**: WCAG 2.1 AA compliance efforts

### Certifications
This is an open-source project without formal security certifications. Security is maintained through:
- Community review
- Automated dependency scanning
- Regular security updates
- Transparent development process

## 🔄 Updates

This security policy is reviewed and updated regularly. Check back for the latest information on our security practices.

---

**Last Updated**: June 2025
**Next Review**: June 2025

For questions about this security policy, please open a GitHub discussion. 