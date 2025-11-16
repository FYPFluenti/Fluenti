#!/usr/bin/env python3
"""
Security Validation Script for Emotional Therapy Bot
This script validates that all security measures are properly implemented and configured.
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path

# Add current directory to path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_dependencies():
    """Check if all required security dependencies are installed"""
    required_packages = [
        'cryptography',
        'pymongo',
        'nltk',
        'langchain_groq'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def validate_environment():
    """Validate environment configuration"""
    issues = []
    warnings = []
    
    # Check critical environment variables
    critical_vars = ['MONGODB_URI']
    for var in critical_vars:
        if not os.getenv(var):
            issues.append(f"Missing critical environment variable: {var}")
    
    # Check security configuration
    security_vars = {
        'ENCRYPTION_ENABLED': 'true',
        'AUDIT_LOGGING': 'true',
        'SANITIZE_INPUTS': 'true',
        'VALIDATE_SESSION_TOKENS': 'true'
    }
    
    for var, recommended in security_vars.items():
        value = os.getenv(var, 'false').lower()
        if value != recommended:
            warnings.append(f"{var} is set to '{value}', recommended: '{recommended}'")
    
    # Check encryption key
    if not os.getenv('ENCRYPTION_KEY'):
        warnings.append("No ENCRYPTION_KEY set - system will generate one")
    
    return issues, warnings

def test_security_manager():
    """Test the SecurityManager functionality"""
    try:
        from security_config import security_config
        from emotional_therapy import security_manager
        
        results = {
            'encryption': False,
            'sanitization': False,
            'rate_limiting': False,
            'session_validation': False,
            'audit_logging': False
        }
        
        # Test encryption
        if security_config.ENCRYPTION_ENABLED:
            test_data = "Test sensitive data"
            encrypted = security_manager.encrypt_sensitive_data(test_data)
            decrypted = security_manager.decrypt_sensitive_data(encrypted)
            results['encryption'] = (test_data == decrypted)
        else:
            results['encryption'] = True  # Skip if disabled
        
        # Test input sanitization
        malicious_input = "<script>alert('xss')</script>SELECT * FROM users"
        sanitized = security_manager.sanitize_input(malicious_input)
        results['sanitization'] = ('<script>' not in sanitized and 'SELECT' not in sanitized)
        
        # Test PII hashing
        test_pii = "user123@example.com"
        hashed = security_manager.hash_pii(test_pii)
        results['pii_hashing'] = (len(hashed) == 16 and hashed != test_pii)
        
        # Test rate limiting
        test_user = "test_user_123"
        results['rate_limiting'] = security_manager.check_rate_limit(test_user)
        
        # Test session token creation
        session_token = security_manager.create_session_token("test_user", "test_session")
        results['session_validation'] = (len(session_token) > 10)
        
        # Test audit logging
        security_manager.audit_log("TEST_EVENT", "test_user", "test_session", {"test": True})
        results['audit_logging'] = True  # If no exception thrown
        
        return results, None
        
    except Exception as e:
        return None, str(e)

def test_therapy_bot_security():
    """Test therapy bot security integration"""
    try:
        # Import with error handling
        from emotional_therapy import interface
        
        if not interface:
            return None, "Therapy bot interface not available"
        
        # Test session creation with security
        welcome_msg = interface.start_session("security_test_user")
        
        if "rate limit" in welcome_msg.lower() or "error" in welcome_msg.lower():
            return False, welcome_msg
        
        # Test secure message sending
        test_message = "Hello, this is a security test message"
        response = interface.send_message(test_message)
        
        if "rate limit" in response.lower() or "security error" in response.lower():
            return False, response
        
        # Test malicious input handling
        malicious_message = "<script>alert('xss')</script>"
        malicious_response = interface.send_message(malicious_message)
        
        # Should either sanitize or reject
        security_handled = (
            "invalid content" in malicious_response.lower() or
            "<script>" not in malicious_response
        )
        
        return security_handled, None
        
    except Exception as e:
        return None, str(e)

def validate_file_permissions():
    """Check file permissions for security"""
    sensitive_files = [
        '.env',
        '.env.security',
        'therapy_audit.log'
    ]
    
    issues = []
    
    for filename in sensitive_files:
        if os.path.exists(filename):
            stat_info = os.stat(filename)
            # Check if file is readable by others (basic check)
            if stat_info.st_mode & 0o044:  # World or group readable
                issues.append(f"{filename} has overly permissive permissions")
    
    return issues

def generate_security_report():
    """Generate comprehensive security validation report"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'status': 'UNKNOWN',
        'checks': {},
        'issues': [],
        'warnings': [],
        'recommendations': []
    }
    
    print("🔒 Running Security Validation...")
    
    # Check dependencies
    print("  Checking dependencies...")
    missing_deps = check_dependencies()
    if missing_deps:
        report['issues'].extend([f"Missing dependency: {dep}" for dep in missing_deps])
    report['checks']['dependencies'] = len(missing_deps) == 0
    
    # Validate environment
    print("  Validating environment...")
    env_issues, env_warnings = validate_environment()
    report['issues'].extend(env_issues)
    report['warnings'].extend(env_warnings)
    report['checks']['environment'] = len(env_issues) == 0
    
    # Test security manager
    print("  Testing security manager...")
    security_results, security_error = test_security_manager()
    if security_error:
        report['issues'].append(f"Security manager test failed: {security_error}")
        report['checks']['security_manager'] = False
    else:
        if security_results is not None:
            failed_tests = [test for test, passed in security_results.items() if not passed]
            if failed_tests:
                report['issues'].extend([f"Security test failed: {test}" for test in failed_tests])
            report['checks']['security_manager'] = len(failed_tests) == 0
            
            # Add individual test results
            for test, result in security_results.items():
                report['checks'][f'security_{test}'] = result
        else:
            report['issues'].append("Security manager test returned None results")
            report['checks']['security_manager'] = False
    
    # Test therapy bot security
    print("  Testing therapy bot security...")
    bot_result, bot_error = test_therapy_bot_security()
    if bot_error:
        report['warnings'].append(f"Therapy bot security test: {bot_error}")
        report['checks']['therapy_bot_security'] = False
    else:
        report['checks']['therapy_bot_security'] = bot_result
    
    # Check file permissions
    print("  Checking file permissions...")
    perm_issues = validate_file_permissions()
    report['issues'].extend(perm_issues)
    report['checks']['file_permissions'] = len(perm_issues) == 0
    
    # Overall status assessment
    critical_checks = ['dependencies', 'environment', 'security_manager']
    critical_passed = all(report['checks'].get(check, False) for check in critical_checks)
    
    if len(report['issues']) == 0 and critical_passed:
        report['status'] = 'SECURE'
    elif len(report['issues']) > 0 and critical_passed:
        report['status'] = 'SECURE_WITH_WARNINGS'
    else:
        report['status'] = 'INSECURE'
    
    # Generate recommendations
    if report['issues']:
        report['recommendations'].append("Address all security issues before deployment")
    if report['warnings']:
        report['recommendations'].append("Review and address security warnings")
    if not report['checks'].get('file_permissions', True):
        report['recommendations'].append("Fix file permissions for sensitive files")
    
    return report

def print_report(report):
    """Print human-readable security report"""
    status_emoji = {
        'SECURE': '✅',
        'SECURE_WITH_WARNINGS': '⚠️',
        'INSECURE': '❌',
        'UNKNOWN': '❓'
    }
    
    print(f"\n{status_emoji.get(report['status'], '❓')} SECURITY STATUS: {report['status']}")
    print(f"Report Generated: {report['timestamp']}")
    print("-" * 60)
    
    # Print check results
    print("\n🔍 SECURITY CHECKS:")
    for check, passed in report['checks'].items():
        emoji = "✅" if passed else "❌"
        print(f"  {emoji} {check.replace('_', ' ').title()}")
    
    # Print issues
    if report['issues']:
        print(f"\n❌ CRITICAL ISSUES ({len(report['issues'])}):")
        for issue in report['issues']:
            print(f"  • {issue}")
    
    # Print warnings
    if report['warnings']:
        print(f"\n⚠️ WARNINGS ({len(report['warnings'])}):")
        for warning in report['warnings']:
            print(f"  • {warning}")
    
    # Print recommendations
    if report['recommendations']:
        print(f"\n💡 RECOMMENDATIONS:")
        for rec in report['recommendations']:
            print(f"  • {rec}")
    
    print("\n" + "=" * 60)
    print("Security validation complete!")

def main():
    """Main security validation function"""
    try:
        report = generate_security_report()
        print_report(report)
        
        # Save report to file
        with open('security_validation_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Full report saved to: security_validation_report.json")
        
        # Exit with appropriate code
        if report['status'] in ['SECURE', 'SECURE_WITH_WARNINGS']:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Security validation failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()