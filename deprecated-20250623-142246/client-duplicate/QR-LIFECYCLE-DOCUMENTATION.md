# QR Code Lifecycle Management Service

## Overview

The QR Lifecycle Service (`qrLifecycleService.ts`) provides comprehensive management of QR codes throughout their entire lifecycle, from generation to expiration. It integrates with validation, notification, and QR services to automate QR code operations based on validation status changes.

## Key Features

### 1. Automatic QR Generation
- Automatically generates QR codes when validations are approved
- Prevents duplicate QR code generation
- Creates lifecycle tracking entries

### 2. QR Code Status Management
The service tracks five distinct QR code statuses:
- **ACTIVE**: Valid and can be scanned
- **EXPIRED**: Validation has expired
- **SUSPENDED**: Temporarily disabled
- **REVOKED**: Permanently disabled
- **PENDING**: Awaiting validation approval

### 3. Batch Operations
- Generate multiple QR codes for product batches
- Batch-specific serial numbers
- Bulk status updates

### 4. Dynamic Content Updates
- Update QR content based on validation changes
- Real-time status synchronization
- Automatic status transitions

### 5. Expiration Management
- Scheduled expiration checks (every 24 hours)
- Automatic invalidation of expired QR codes
- Expiration warnings (30 days before expiry)

## Service Methods

### Core Methods

#### `generateOnApproval(validationId: string)`
Automatically generates a QR code when a validation is approved.
```typescript
const result = await qrLifecycleService.generateOnApproval('validation-id');
// Returns: { success: boolean, qrCode?: string, message: string }
```

#### `invalidateOnExpiry(validationId: string)`
Marks QR code as invalid when validation expires.
```typescript
const result = await qrLifecycleService.invalidateOnExpiry('validation-id');
// Returns: { success: boolean, message: string }
```

#### `regenerateForBatch(productId: string, batchNumber: string)`
Generates batch-specific QR codes.
```typescript
const result = await qrLifecycleService.regenerateForBatch('product-id', 'BATCH-001');
// Returns: { success: boolean, qrCodes?: string[], message: string }
```

#### `updateQRContent(qrCode: string, validationData: ValidationData)`
Updates QR content dynamically based on validation status.
```typescript
const result = await qrLifecycleService.updateQRContent('qr-code', {
  status: 'APPROVED',
  summary: 'Updated validation summary',
  validatedAt: new Date().toISOString()
});
```

#### `getQRStatus(qrCode: string)`
Gets current status and full lifecycle information.
```typescript
const status = await qrLifecycleService.getQRStatus('qr-code');
// Returns: { status: QRCodeStatus, lifecycle?: QRCodeLifecycle, validation?: Validation, product?: Product }
```

### Lifecycle Management

#### `suspendQRCode(qrCode: string, reason: string)`
Temporarily suspends a QR code.

#### `reactivateQRCode(qrCode: string, reason: string)`
Reactivates a suspended QR code.

#### `revokeQRCode(qrCode: string, reason: string)`
Permanently revokes a QR code.

### Batch Operations

#### `generateBatchQRCodes(request: BatchQRGenerationRequest)`
Generates multiple QR codes for a batch.
```typescript
const result = await qrLifecycleService.generateBatchQRCodes({
  productId: 'product-id',
  batchNumber: 'BATCH-001',
  quantity: 100,
  validationId: 'validation-id',
  expirationDate: '2024-12-31T23:59:59Z'
});
```

### Scheduled Operations

#### `scheduleExpirationCheck()`
Starts automatic expiration checks (runs every 24 hours).

#### `stopExpirationCheck()`
Stops scheduled expiration checks.

## Integration Points

### 1. Validation Service Integration
- Monitors validation status changes
- Triggers QR generation on approval
- Handles validation expiration

### 2. QR Service Integration
- Generates QR codes
- Updates QR content
- Manages QR code data

### 3. Notification Service Integration
- Sends notifications for:
  - QR code generation
  - Expiration warnings
  - Status changes

## Data Structures

### QRCodeLifecycle
```typescript
interface QRCodeLifecycle {
  qrCode: string;
  productId: string;
  validationId?: string;
  batchNumber?: string;
  status: QRCodeStatus;
  generatedAt: string;
  activatedAt?: string;
  expiredAt?: string;
  suspendedAt?: string;
  revokedAt?: string;
  lastStatusChange: string;
  statusHistory: QRStatusChange[];
  expirationDate?: string;
  autoRenew: boolean;
}
```

### QRStatusChange
```typescript
interface QRStatusChange {
  previousStatus: QRCodeStatus;
  newStatus: QRCodeStatus;
  changedAt: string;
  reason: string;
  changedBy?: string;
}
```

## Usage Examples

### Example 1: Automatic QR Generation on Validation Approval
```typescript
// When a validation is approved
const validation = await validationService.updateValidation(validationId, {
  status: 'APPROVED'
});

// Automatically generate QR code
const qrResult = await qrLifecycleService.generateOnApproval(validationId);

if (qrResult.success) {
  console.log('QR Code generated:', qrResult.qrCode);
}
```

### Example 2: Batch QR Generation
```typescript
// Generate 50 QR codes for a specific batch
const batchResult = await qrLifecycleService.generateBatchQRCodes({
  productId: 'product-123',
  batchNumber: 'BATCH-2024-001',
  quantity: 50,
  validationId: 'validation-456',
  expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
});

console.log(`Generated ${batchResult.qrCodes?.length} QR codes`);
```

### Example 3: Handling Validation Expiration
```typescript
// When validation expires
await qrLifecycleService.invalidateOnExpiry(validationId);

// All associated QR codes are automatically marked as EXPIRED
```

### Example 4: Temporary Suspension
```typescript
// Suspend QR code for investigation
await qrLifecycleService.suspendQRCode(qrCode, 'Pending quality review');

// Later, reactivate after review
await qrLifecycleService.reactivateQRCode(qrCode, 'Quality review completed');
```

## Testing

A comprehensive test page is available at `/dashboard/test-qr-lifecycle` (development only) that allows testing of all QR lifecycle operations.

### Test Scenarios:
1. Generate QR on validation approval
2. Check QR status
3. Suspend and reactivate QR codes
4. Generate batch QR codes
5. Update QR content
6. Test expiration handling

## Best Practices

1. **Always check validation status** before generating QR codes
2. **Use batch generation** for multiple products from the same batch
3. **Monitor expiration warnings** to plan revalidation
4. **Document status changes** with clear reasons
5. **Handle errors gracefully** - all methods return success/failure status

## Error Handling

All service methods return a consistent response format:
```typescript
{
  success: boolean;
  message: string;
  // Optional data depending on the method
  qrCode?: string;
  qrCodes?: string[];
}
```

Always check the `success` flag before proceeding with operations.

## Future Enhancements

1. **Auto-renewal**: Automatic QR renewal before expiration
2. **Bulk operations**: Mass status updates
3. **Analytics integration**: Track QR lifecycle metrics
4. **Webhook support**: Notify external systems of status changes
5. **Custom expiration rules**: Product-specific expiration policies