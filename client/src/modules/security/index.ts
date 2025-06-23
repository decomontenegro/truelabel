/**
 * Security Module Exports
 * 
 * Ponto central de exportação do módulo de segurança
 */

// Types
export type {
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecurityFilter,
  SecurityMetrics,
  AuditLog,
  AuditAction,
  SecurityPolicy,
  SecurityPolicyType,
  SecurityRule,
  SecurityAction,
  AccessControl,
  Permission,
  AccessCondition,
  UserSession,
  SessionActivity,
  RiskAssessment,
  RiskFactor,
  ComplianceReport,
  ComplianceType,
  ComplianceFinding,
  ThreatDetection,
  ThreatType,
  ThreatIndicator,
  SecurityConfiguration,
  PasswordPolicy,
  SessionPolicy,
  AccessPolicy,
  MonitoringPolicy,
  ComplianceSettings,
  GeoLocation
} from './types';

// Hooks
export {
  useSecurityEvents,
  useSecurityMetrics,
  useAuditLogs,
  useSecurityPolicies,
  useRiskAssessment,
  useThreatDetection,
  useComplianceReports,
  useUserSessions,
  useRealTimeSecurityEvents,
  useSecurityFilters,
  SECURITY_QUERY_KEYS
} from './hooks/useSecurity';

// Services
export { securityService } from './services/securityService';

// Components
export { SecurityDashboard } from './components/SecurityDashboard';
export { SecurityEventsList } from './components/SecurityEventsList';

// Utils
export { securityUtils } from './utils/securityUtils';

// Constants
export const SECURITY_EVENT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_SUSPICIOUS: 'LOGIN_SUSPICIOUS',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DATA_ACCESS: 'DATA_ACCESS',
  DATA_EXPORT: 'DATA_EXPORT',
  API_ABUSE: 'API_ABUSE',
  BRUTE_FORCE: 'BRUTE_FORCE',
  SQL_INJECTION: 'SQL_INJECTION',
  XSS_ATTEMPT: 'XSS_ATTEMPT',
  CSRF_ATTEMPT: 'CSRF_ATTEMPT',
  MALWARE_DETECTED: 'MALWARE_DETECTED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  COMPLIANCE_ISSUE: 'COMPLIANCE_ISSUE',
} as const;

export const SECURITY_SEVERITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ASSIGN: 'ASSIGN',
  UNASSIGN: 'UNASSIGN',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  ARCHIVE: 'ARCHIVE',
  RESTORE: 'RESTORE',
} as const;

export const THREAT_TYPES = {
  MALWARE: 'MALWARE',
  PHISHING: 'PHISHING',
  BRUTE_FORCE: 'BRUTE_FORCE',
  DDoS: 'DDoS',
  DATA_BREACH: 'DATA_BREACH',
  INSIDER_THREAT: 'INSIDER_THREAT',
  APT: 'APT',
  RANSOMWARE: 'RANSOMWARE',
  SOCIAL_ENGINEERING: 'SOCIAL_ENGINEERING',
} as const;

export const COMPLIANCE_TYPES = {
  GDPR: 'GDPR',
  LGPD: 'LGPD',
  SOX: 'SOX',
  HIPAA: 'HIPAA',
  PCI_DSS: 'PCI_DSS',
  ISO27001: 'ISO27001',
} as const;

export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
