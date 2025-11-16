"""
Security Monitoring and Compliance Tools for Emotional Therapy Bot
This module provides tools for monitoring security events and ensuring compliance.
"""

import json
import os
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, Counter
import hashlib

class SecurityMonitor:
    """Monitor security events and generate compliance reports"""
    
    def __init__(self, audit_log_file: Optional[str] = None):
        self.audit_log_file = audit_log_file or os.getenv('AUDIT_LOG_FILE', 'therapy_audit.log')
        self.security_events = defaultdict(list)
        self.alert_thresholds = {
            'RATE_LIMIT_EXCEEDED': 10,  # Alert if more than 10 rate limit violations per hour
            'INVALID_SESSION_ACCESS': 5,  # Alert if more than 5 invalid session attempts per hour
            'HIGH_CRISIS_DETECTED': 1,   # Alert immediately on high crisis detection
            'MALICIOUS_INPUT_BLOCKED': 3  # Alert if more than 3 malicious inputs per hour
        }
    
    def analyze_security_events(self, hours_back: int = 24) -> Dict[str, Any]:
        """Analyze security events from the last N hours"""
        try:
            events = self._load_recent_events(hours_back)
            
            analysis = {
                'time_period': f"Last {hours_back} hours",
                'total_events': len(events),
                'event_types': {},
                'security_alerts': [],
                'user_activity': {},
                'session_analysis': {},
                'risk_assessment': 'LOW'
            }
            
            # Count event types
            event_counter = Counter()
            user_activity = defaultdict(int)
            session_activity = defaultdict(int)
            
            for event in events:
                event_type = event.get('event', 'UNKNOWN')
                event_counter[event_type] += 1
                
                user_hash = event.get('user_hash', 'unknown')
                session_hash = event.get('session_hash', 'unknown')
                
                user_activity[user_hash] += 1
                session_activity[session_hash] += 1
            
            analysis['event_types'] = dict(event_counter)
            analysis['user_activity'] = dict(user_activity)
            analysis['session_analysis'] = {
                'active_sessions': len(session_activity),
                'total_session_events': sum(session_activity.values())
            }
            
            # Check for security alerts
            for event_type, threshold in self.alert_thresholds.items():
                count = event_counter.get(event_type, 0)
                if count >= threshold:
                    analysis['security_alerts'].append({
                        'type': event_type,
                        'count': count,
                        'threshold': threshold,
                        'severity': 'HIGH' if event_type in ['HIGH_CRISIS_DETECTED'] else 'MEDIUM'
                    })
            
            # Risk assessment
            if analysis['security_alerts']:
                high_severity_alerts = [a for a in analysis['security_alerts'] if a['severity'] == 'HIGH']
                if high_severity_alerts:
                    analysis['risk_assessment'] = 'HIGH'
                else:
                    analysis['risk_assessment'] = 'MEDIUM'
            
            return analysis
            
        except Exception as e:
            return {
                'error': str(e),
                'analysis_failed': True,
                'time_period': f"Last {hours_back} hours"
            }
    
    def _load_recent_events(self, hours_back: int) -> List[Dict]:
        """Load security events from the last N hours"""
        events = []
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        try:
            if os.path.exists(self.audit_log_file):
                with open(self.audit_log_file, 'r') as f:
                    for line in f:
                        try:
                            # Parse log line
                            if ' - Details: ' in line:
                                parts = line.strip().split(' - Details: ')
                                if len(parts) == 2:
                                    details_json = parts[1]
                                    event_data = json.loads(details_json)
                                    
                                    # Extract timestamp and event type from log line
                                    log_parts = parts[0].split(' - ')
                                    if len(log_parts) >= 3:
                                        timestamp_str = log_parts[0]
                                        event_type = log_parts[2]
                                        
                                        # Parse timestamp
                                        try:
                                            event_time = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                                            event_time = event_time.replace(tzinfo=timezone.utc)
                                            
                                            if event_time >= cutoff_time:
                                                event_data.update({
                                                    'timestamp': event_time.isoformat(),
                                                    'event': event_type
                                                })
                                                events.append(event_data)
                                        except ValueError:
                                            continue
                        except (json.JSONDecodeError, IndexError):
                            continue
        except Exception as e:
            print(f"Error loading audit log: {e}")
        
        return events
    
    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate a compliance report for data protection and security"""
        report = {
            'report_date': datetime.now(timezone.utc).isoformat(),
            'compliance_status': {},
            'security_measures': {},
            'data_protection': {},
            'recommendations': []
        }
        
        # Check security configurations
        from security_config import security_config
        
        report['security_measures'] = {
            'encryption_enabled': security_config.ENCRYPTION_ENABLED,
            'audit_logging_enabled': security_config.AUDIT_LOGGING,
            'input_sanitization': security_config.SANITIZE_INPUTS,
            'session_validation': security_config.VALIDATE_SESSION_TOKENS,
            'rate_limiting': True,
            'data_retention_days': security_config.DATA_RETENTION_DAYS
        }
        
        # Data protection compliance
        report['data_protection'] = {
            'pii_hashing': True,
            'sensitive_data_encryption': security_config.ENCRYPTION_ENABLED,
            'data_minimization': True,
            'user_anonymization': True,
            'automatic_cleanup': True
        }
        
        # Compliance status assessment
        compliance_score = 0
        total_checks = 0
        
        security_checks = [
            ('Encryption', security_config.ENCRYPTION_ENABLED),
            ('Audit Logging', security_config.AUDIT_LOGGING),
            ('Input Sanitization', security_config.SANITIZE_INPUTS),
            ('Session Validation', security_config.VALIDATE_SESSION_TOKENS),
            ('Data Retention Policy', security_config.DATA_RETENTION_DAYS <= 90)
        ]
        
        for check_name, status in security_checks:
            total_checks += 1
            if status:
                compliance_score += 1
            else:
                report['recommendations'].append(f"Enable {check_name} for better security compliance")
        
        compliance_percentage = (compliance_score / total_checks) * 100
        report['compliance_status'] = {
            'overall_score': compliance_percentage,
            'status': 'COMPLIANT' if compliance_percentage >= 80 else 'NEEDS_IMPROVEMENT',
            'checks_passed': compliance_score,
            'total_checks': total_checks
        }
        
        # Additional recommendations
        if security_config.DATA_RETENTION_DAYS > 30:
            report['recommendations'].append("Consider reducing data retention period for enhanced privacy")
        
        if not os.getenv('ENCRYPTION_KEY'):
            report['recommendations'].append("Set a dedicated encryption key in environment variables")
        
        return report
    
    def check_system_health(self) -> Dict[str, Any]:
        """Check overall system health and security status"""
        health_report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'system_status': 'HEALTHY',
            'security_status': 'SECURE',
            'checks': {},
            'alerts': [],
            'metrics': {}
        }
        
        try:
            # Check if audit log is accessible
            if os.path.exists(self.audit_log_file):
                health_report['checks']['audit_log'] = 'ACCESSIBLE'
            else:
                health_report['checks']['audit_log'] = 'MISSING'
                health_report['alerts'].append("Audit log file not found")
            
            # Check recent security events
            recent_analysis = self.analyze_security_events(1)  # Last 1 hour
            health_report['metrics']['recent_events'] = recent_analysis.get('total_events', 0)
            
            if recent_analysis.get('security_alerts'):
                health_report['security_status'] = 'ALERT'
                health_report['alerts'].extend([
                    f"{alert['type']}: {alert['count']} events" 
                    for alert in recent_analysis['security_alerts']
                ])
            
            # Check configuration
            from security_config import security_config
            config_warnings = security_config.validate_configuration()
            if config_warnings:
                health_report['alerts'].extend(config_warnings)
                if len(config_warnings) > 3:
                    health_report['system_status'] = 'WARNING'
            
            health_report['checks']['configuration'] = 'VALID' if not config_warnings else 'WARNING'
            
        except Exception as e:
            health_report['system_status'] = 'ERROR'
            health_report['alerts'].append(f"Health check failed: {str(e)}")
        
        return health_report

def generate_security_summary() -> str:
    """Generate a human-readable security summary"""
    monitor = SecurityMonitor()
    
    try:
        analysis = monitor.analyze_security_events(24)
        compliance = monitor.generate_compliance_report()
        health = monitor.check_system_health()
        
        summary = f"""
🔒 SECURITY SUMMARY REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 SECURITY EVENTS (Last 24 hours):
- Total Events: {analysis.get('total_events', 0)}
- Risk Level: {analysis.get('risk_assessment', 'UNKNOWN')}
- Active Sessions: {analysis.get('session_analysis', {}).get('active_sessions', 0)}

🛡️ COMPLIANCE STATUS:
- Overall Score: {compliance.get('compliance_status', {}).get('overall_score', 0):.1f}%
- Status: {compliance.get('compliance_status', {}).get('status', 'UNKNOWN')}
- Security Measures: {sum(1 for v in compliance.get('security_measures', {}).values() if v)}/6 enabled

⚡ SYSTEM HEALTH:
- System Status: {health.get('system_status', 'UNKNOWN')}
- Security Status: {health.get('security_status', 'UNKNOWN')}
- Active Alerts: {len(health.get('alerts', []))}

🔍 RECENT ACTIVITY:
"""
        
        # Add event breakdown
        event_types = analysis.get('event_types', {})
        for event_type, count in event_types.items():
            summary += f"- {event_type}: {count}\n"
        
        # Add alerts if any
        alerts = analysis.get('security_alerts', [])
        if alerts:
            summary += "\n⚠️ SECURITY ALERTS:\n"
            for alert in alerts:
                summary += f"- {alert['type']}: {alert['count']} events (threshold: {alert['threshold']})\n"
        
        # Add recommendations
        recommendations = compliance.get('recommendations', [])
        if recommendations:
            summary += "\n💡 RECOMMENDATIONS:\n"
            for rec in recommendations[:3]:  # Show top 3
                summary += f"- {rec}\n"
        
        return summary
        
    except Exception as e:
        return f"❌ Security summary generation failed: {str(e)}"

if __name__ == "__main__":
    print(generate_security_summary())