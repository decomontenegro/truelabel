// Supply chain event types
export interface SupplyChainEvent {
  id: string;
  type: 'HARVEST' | 'PROCESSING' | 'PACKAGING' | 'SHIPPING' | 'STORAGE' | 'DISTRIBUTION' | 'RETAIL' | 'CUSTOM';
  title: string;
  description: string;
  location: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  documents?: TraceabilityDocument[];
  images?: string[];
  certifications?: string[];
  verificationHash?: string;
  metadata?: Record<string, any>;
}

// Batch tracking interfaces
export interface BatchInfo {
  id: string;
  batchNumber: string;
  productId: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'RECALLED' | 'EXPIRED' | 'CONSUMED';
  events: SupplyChainEvent[];
  parentBatchId?: string; // For tracking batch splits/merges
  childBatchIds?: string[]; // For tracking batch splits
  qualityTests?: QualityTest[];
}

export interface QualityTest {
  id: string;
  testType: string;
  date: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  parameters: Record<string, any>;
  laboratoryId?: string;
  certificateUrl?: string;
}

// Supplier information types
export interface Supplier {
  id: string;
  name: string;
  type: 'FARMER' | 'PROCESSOR' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'RETAILER';
  country: string;
  region?: string;
  address?: string;
  contact?: {
    name: string;
    email: string;
    phone: string;
  };
  certifications?: SupplierCertification[];
  rating?: number;
  verified: boolean;
  since: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  sustainabilityScore?: number;
  fairTradeVerified?: boolean;
}

export interface SupplierCertification {
  name: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  certificateUrl?: string;
}

// Origin verification types
export interface OriginClaim {
  id: string;
  productId: string;
  claimType: 'COUNTRY' | 'REGION' | 'FARM' | 'FACILITY';
  location: string;
  verified: boolean;
  verificationMethod?: 'GPS' | 'BLOCKCHAIN' | 'CERTIFICATE' | 'AUDIT';
  verificationDate?: string;
  evidence?: OriginEvidence[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OriginEvidence {
  type: 'DOCUMENT' | 'IMAGE' | 'GPS_LOG' | 'BLOCKCHAIN_HASH';
  url?: string;
  hash?: string;
  timestamp: string;
  description?: string;
}

// Traceability document types
export interface TraceabilityDocument {
  id: string;
  type: 'INVOICE' | 'CERTIFICATE' | 'LAB_REPORT' | 'SHIPPING_MANIFEST' | 'OTHER';
  name: string;
  url: string;
  uploadDate: string;
  verificationHash?: string;
}

// Supply chain route
export interface SupplyChainRoute {
  id: string;
  productId: string;
  batchId?: string;
  routes: RouteSegment[];
  totalDistance?: number;
  totalDuration?: number;
  carbonFootprint?: number;
}

export interface RouteSegment {
  from: LocationPoint;
  to: LocationPoint;
  transportMode: 'SHIP' | 'TRUCK' | 'RAIL' | 'AIR' | 'MIXED';
  distance?: number;
  duration?: number;
  startDate: string;
  endDate?: string;
  carrier?: string;
  trackingNumber?: string;
  temperature?: TemperatureLog[];
}

export interface LocationPoint {
  name: string;
  type: 'ORIGIN' | 'PROCESSING' | 'WAREHOUSE' | 'PORT' | 'DESTINATION';
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  facility?: string;
}

export interface TemperatureLog {
  timestamp: string;
  temperature: number;
  unit: 'C' | 'F';
}

// Traceability report types
export interface TraceabilityReport {
  id: string;
  productId: string;
  batchId?: string;
  generatedAt: string;
  reportType: 'FULL' | 'SUMMARY' | 'COMPLIANCE' | 'SUSTAINABILITY';
  data: {
    timeline: SupplyChainEvent[];
    suppliers: Supplier[];
    route: SupplyChainRoute;
    compliance: ComplianceData;
    sustainability?: SustainabilityMetrics;
  };
}

export interface ComplianceData {
  standards: string[];
  violations: number;
  lastAudit?: string;
  certifications: string[];
  riskScore: number;
}

export interface SustainabilityMetrics {
  carbonFootprint: number;
  waterUsage?: number;
  fairTradePercentage?: number;
  localSourcing?: number;
  packagingRecyclability?: number;
}

// API request/response types
export interface CreateSupplyChainEventData {
  productId: string;
  batchId?: string;
  type: SupplyChainEvent['type'];
  title: string;
  description: string;
  location: string;
  timestamp?: string;
  temperature?: number;
  humidity?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  metadata?: Record<string, any>;
}

export interface TraceabilitySearchParams {
  productId?: string;
  batchNumber?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: SupplyChainEvent['type'];
}

export interface SupplyChainSummary {
  totalEvents: number;
  uniqueLocations: number;
  totalDistance?: number;
  averageTemperature?: number;
  complianceScore: number;
  keyMilestones: SupplyChainEvent[];
}