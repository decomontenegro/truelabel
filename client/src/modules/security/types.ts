/**
 * Security Module Types
 * 
 * Tipos para o módulo de segurança e auditoria
 */

// Security Event Types
export interface SecurityEvent {
  id: string;
  userId?: string;
  sessionId?: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  location?: GeoLocation;
  metadata?: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_SUSPICIOUS'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PERMISSION_DENIED'
  | 'DATA_ACCESS'
  | 'DATA_EXPORT'
  | 'API_ABUSE'
  | 'BRUTE_FORCE'
  | 'SQL_INJECTION'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT'
  | 'MALWARE_DETECTED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'POLICY_VIOLATION'
  | 'COMPLIANCE_ISSUE';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  state?: string;
  country: string;
  region?: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'ARCHIVE'
  | 'RESTORE';

// Security Policy Types
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  type: SecurityPolicyType;
  rules: SecurityRule[];
  enabled: boolean;
  severity: SecuritySeverity;
  actions: SecurityAction[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type SecurityPolicyType =
  | 'PASSWORD_POLICY'
  | 'ACCESS_CONTROL'
  | 'RATE_LIMITING'
  | 'IP_WHITELIST'
  | 'IP_BLACKLIST'
  | 'DATA_RETENTION'
  | 'COMPLIANCE'
  | 'MONITORING';

export interface SecurityRule {
  id: string;
  condition: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'REGEX';
  value: string | number | boolean;
  description?: string;
}

export interface SecurityAction {
  type: 'BLOCK' | 'ALERT' | 'LOG' | 'NOTIFY' | 'QUARANTINE' | 'RATE_LIMIT';
  parameters?: Record<string, any>;
}

// Access Control Types
export interface AccessControl {
  userId: string;
  resourceType: string;
  resourceId?: string;
  permissions: Permission[];
  conditions?: AccessCondition[];
  expiresAt?: string;
  grantedBy: string;
  grantedAt: string;
}

export interface Permission {
  action: string;
  granted: boolean;
  conditions?: string[];
}

export interface AccessCondition {
  type: 'TIME_BASED' | 'IP_BASED' | 'LOCATION_BASED' | 'DEVICE_BASED';
  parameters: Record<string, any>;
}

// Session Management Types
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  active: boolean;
  deviceFingerprint?: string;
  riskScore: number;
}

export interface SessionActivity {
  sessionId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
  details?: Record<string, any>;
}

// Risk Assessment Types
export interface RiskAssessment {
  userId: string;
  sessionId?: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  recommendations: string[];
  timestamp: string;
  validUntil: string;
}

export interface RiskFactor {
  type: string;
  description: string;
  score: number;
  weight: number;
  evidence?: Record<string, any>;
}

// Compliance Types
export interface ComplianceReport {
  id: string;
  type: ComplianceType;
  period: {
    start: string;
    end: string;
  };
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'PENDING';
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedAt: string;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type ComplianceType = 'GDPR' | 'LGPD' | 'SOX' | 'HIPAA' | 'PCI_DSS' | 'ISO27001';

export interface ComplianceFinding {
  id: string;
  severity: SecuritySeverity;
  category: string;
  description: string;
  evidence: string[];
  remediation: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK';
  assignedTo?: string;
  dueDate?: string;
}

// Threat Detection Types
export interface ThreatDetection {
  id: string;
  type: ThreatType;
  severity: SecuritySeverity;
  description: string;
  indicators: ThreatIndicator[];
  affectedUsers: string[];
  affectedResources: string[];
  detectedAt: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'FALSE_POSITIVE';
  mitigationSteps: string[];
  assignedTo?: string;
}

export type ThreatType =
  | 'MALWARE'
  | 'PHISHING'
  | 'BRUTE_FORCE'
  | 'DDoS'
  | 'DATA_BREACH'
  | 'INSIDER_THREAT'
  | 'APT'
  | 'RANSOMWARE'
  | 'SOCIAL_ENGINEERING';

export interface ThreatIndicator {
  type: 'IP' | 'DOMAIN' | 'URL' | 'FILE_HASH' | 'EMAIL' | 'USER_BEHAVIOR';
  value: string;
  confidence: number;
  source: string;
}

// Security Metrics Types
export interface SecurityMetrics {
  overview: {
    totalEvents: number;
    criticalEvents: number;
    resolvedEvents: number;
    averageResolutionTime: number;
  };
  eventsByType: Array<{
    type: SecurityEventType;
    count: number;
    percentage: number;
  }>;
  eventsBySeverity: Array<{
    severity: SecuritySeverity;
    count: number;
    percentage: number;
  }>;
  topThreats: Array<{
    type: ThreatType;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  complianceStatus: Array<{
    type: ComplianceType;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    score: number;
  }>;
  riskDistribution: Array<{
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    count: number;
    percentage: number;
  }>;
  trends: {
    events: Array<{ date: string; count: number }>;
    threats: Array<{ date: string; count: number }>;
    compliance: Array<{ date: string; score: number }>;
  };
}

// Security Configuration Types
export interface SecurityConfiguration {
  passwordPolicy: PasswordPolicy;
  sessionPolicy: SessionPolicy;
  accessPolicy: AccessPolicy;
  monitoringPolicy: MonitoringPolicy;
  complianceSettings: ComplianceSettings;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  historyCount: number;
  lockoutThreshold: number;
  lockoutDuration: number; // minutes
}

export interface SessionPolicy {
  maxDuration: number; // minutes
  idleTimeout: number; // minutes
  maxConcurrentSessions: number;
  requireReauth: boolean;
  reauthInterval: number; // minutes
}

export interface AccessPolicy {
  defaultPermissions: string[];
  requireMFA: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
  allowedCountries: string[];
  blockedCountries: string[];
}

export interface MonitoringPolicy {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  retentionPeriod: number; // days
  alertThresholds: Record<SecurityEventType, number>;
  notificationChannels: string[];
}

export interface ComplianceSettings {
  enabledStandards: ComplianceType[];
  dataRetentionPeriod: number; // days
  anonymizationRules: string[];
  consentTracking: boolean;
  rightToErasure: boolean;
}

// Filter Types
export interface SecurityFilter {
  eventTypes?: SecurityEventType[];
  severities?: SecuritySeverity[];
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
  ipAddress?: string;
  resolved?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
