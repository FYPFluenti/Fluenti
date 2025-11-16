# Security and Privacy Implementation Guide

## Overview

This document outlines the comprehensive security and privacy controls implemented in the Emotional Therapy Bot system. The implementation follows industry best practices for handling sensitive mental health data.

## Security Features Implemented

### 1. Data Encryption
- **Sensitive Data Encryption**: All user inputs and bot responses are encrypted using Fernet symmetric encryption
- **Key Management**: Encryption keys are derived using PBKDF2 with 100,000 iterations
- **Configurable**: Can be enabled/disabled via environment variables

### 2. Input Sanitization
- **XSS Prevention**: HTML escaping of user inputs
- **SQL Injection Protection**: Pattern-based filtering of dangerous SQL keywords
- **Script Injection Prevention**: Removal of JavaScript and other script tags
- **Length Limits**: Configurable maximum input length (default: 5000 characters)

### 3. Access Control
- **Session Validation**: Secure session tokens with expiration
- **User ID Hashing**: All user identifiers are hashed for privacy
- **Session Isolation**: Strict separation between different user sessions
- **Rate Limiting**: Configurable limits on requests per hour per user

### 4. Audit Logging
- **Comprehensive Logging**: All security events are logged
- **PII Protection**: No personally identifiable information in logs
- **Structured Format**: JSON-formatted audit entries
- **Configurable**: Can be enabled/disabled as needed

### 5. Privacy Controls
- **Data Minimization**: Only necessary data is stored
- **Automatic Cleanup**: Configurable data retention periods
- **User Anonymization**: Function to anonymize user data on request
- **Hashed Identifiers**: User IDs and session IDs are hashed in storage

## Configuration

### Environment Variables

```bash
# Security Settings
ENCRYPTION_ENABLED=true
ENCRYPTION_KEY=your-secure-encryption-key-here
ENCRYPTION_SALT=therapy_bot_secure_salt_2025

# Audit and Logging
AUDIT_LOGGING=true
AUDIT_LOG_FILE=therapy_audit.log

# Input Validation
SANITIZE_INPUTS=true
MAX_INPUT_LENGTH=5000

# Session Management
VALIDATE_SESSION_TOKENS=true
MAX_SESSION_DURATION=86400  # 24 hours
MAX_CONVERSATIONS_PER_SESSION=1000

# Rate Limiting
RATE_LIMIT_WINDOW=3600  # 1 hour
MAX_REQUESTS_PER_HOUR=100

# Data Retention
DATA_RETENTION_DAYS=30
AUTOMATIC_CLEANUP=true

# Crisis Detection
CRISIS_ALERT_ENABLED=true
LOG_CRISIS_DETAILS=false  # Set to false to avoid logging crisis content
```

### Security Configuration Class

The `SecurityConfig` class in `security_config.py` provides centralized configuration management:

- Input validation rules
- PII field identification
- Security headers configuration
- Configuration validation with warnings

## Security Decorators

### @require_valid_session
Validates session tokens before allowing access to sensitive functions.

```python
@require_valid_session
def save_conversation(self, user_id: str, session_id: str, ...):
    # Function implementation
```

### @rate_limit_check
Enforces rate limits to prevent abuse.

```python
@rate_limit_check
def detect_crisis_level(self, text: str, user_id: str):
    # Function implementation
```

## Data Protection Measures

### 1. Encryption at Rest
- User inputs and bot responses are encrypted before storage
- Encryption keys are derived securely using PBKDF2
- Encrypted data is base64 encoded for storage

### 2. Data Anonymization
```python
# Anonymize user data
storage.anonymize_user_data(user_id)
```

### 3. Automatic Data Cleanup
```python
# Clean up expired data
storage.cleanup_expired_data()
```

### 4. PII Hashing
All personally identifiable information is hashed using SHA-256:
- User IDs
- Session IDs
- Login credentials
- User agents

## Security Monitoring

### Security Monitor Class
The `SecurityMonitor` class provides:
- Security event analysis
- Compliance reporting
- System health checks
- Real-time alerting

### Usage Examples

```python
from security_monitor import SecurityMonitor, generate_security_summary

# Generate security summary
summary = generate_security_summary()
print(summary)

# Detailed analysis
monitor = SecurityMonitor()
analysis = monitor.analyze_security_events(hours_back=24)
compliance = monitor.generate_compliance_report()
health = monitor.check_system_health()
```

## Security Best Practices

### 1. Deployment Security
- Use HTTPS for all communications
- Set secure environment variables
- Use MongoDB authentication and SSL
- Implement network-level security (VPC, firewalls)

### 2. Key Management
- Generate strong encryption keys
- Store keys securely (e.g., Azure Key Vault, AWS Secrets Manager)
- Rotate keys regularly
- Never commit keys to source control

### 3. Monitoring and Alerting
- Monitor audit logs regularly
- Set up alerts for security events
- Implement log rotation
- Regular security health checks

### 4. Data Governance
- Implement data retention policies
- Regular data cleanup
- User consent management
- Incident response procedures

## Compliance Features

### GDPR Compliance
- Right to be forgotten (data anonymization)
- Data minimization
- Consent management
- Audit trails

### HIPAA Considerations
- Data encryption
- Access controls
- Audit logging
- User authentication

### General Privacy
- PII hashing
- Sensitive data encryption
- Configurable data retention
- User anonymization

## Security Validation

### Configuration Validation
The system automatically validates security configuration:

```python
from security_config import security_config

warnings = security_config.validate_configuration()
for warning in warnings:
    print(f"⚠️ {warning}")
```

### Security Status Check
```python
from security_monitor import SecurityMonitor

monitor = SecurityMonitor()
health = monitor.check_system_health()
print(f"Security Status: {health['security_status']}")
```

## Emergency Procedures

### Crisis Detection Security
- High-risk crisis detection triggers immediate audit logging
- Crisis details are not logged by default (configurable)
- Emergency notifications are sent securely

### Security Incident Response
1. Identify the incident through monitoring
2. Isolate affected systems
3. Analyze audit logs
4. Implement containment measures
5. Document and report

### Data Breach Response
1. Immediate assessment of scope
2. Notification procedures
3. User communication
4. Regulatory reporting
5. System hardening

## Testing Security

### Security Test Functions
```python
def test_encryption():
    # Test data encryption/decryption
    
def test_input_sanitization():
    # Test malicious input handling
    
def test_session_validation():
    # Test session security
    
def test_rate_limiting():
    # Test rate limit enforcement
```

### Penetration Testing Checklist
- [ ] Input validation bypass attempts
- [ ] Session hijacking tests
- [ ] Rate limit bypass tests
- [ ] Data exposure tests
- [ ] Authentication bypass tests

## Maintenance

### Regular Tasks
- Review audit logs weekly
- Update security configurations monthly
- Rotate encryption keys quarterly
- Conduct security assessments annually

### Monitoring Dashboard
Key metrics to monitor:
- Failed authentication attempts
- Rate limit violations
- Encryption failures
- Data cleanup operations
- Crisis detection events

## Support and Contact

For security-related issues or questions:
1. Check audit logs first
2. Review configuration settings
3. Use security monitoring tools
4. Contact system administrators

## Version History

- **v2.0** (2025-11-16): Comprehensive security implementation
  - Data encryption
  - Input sanitization
  - Access controls
  - Audit logging
  - Privacy controls
  - Security monitoring