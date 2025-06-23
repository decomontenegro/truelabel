# Automated Validation Engine

## Overview

The Automated Validation Engine is a sophisticated system that processes laboratory reports and automatically creates product validations based on regulatory rules and data analysis. It includes queue management, confidence scoring, and a feedback loop for continuous improvement.

## Architecture

### Core Components

1. **AutomatedValidationService** (`src/services/automatedValidationService.ts`)
   - Queue management for validation requests
   - Report parsing and analysis
   - Validation creation with confidence scoring
   - Workflow state management
   - Retry logic and error handling

2. **Integration Points**
   - `reportService`: Retrieves report data
   - `validationService`: Creates validations
   - `notificationService`: Sends alerts
   - `qrService`: Generates QR codes for validated products

## Features

### 1. Queue Management

The engine uses a priority-based queue system:

```typescript
Priority Levels:
- URGENT: Processed immediately
- HIGH: Processed before normal items
- NORMAL: Standard processing
- LOW: Processed when queue is clear
```

### 2. Workflow States

Each validation request goes through the following states:

- **QUEUED**: Waiting for processing
- **ANALYZING**: Report being parsed and analyzed
- **VALIDATING**: Applying validation rules and scoring
- **REVIEW_REQUIRED**: Manual review needed (confidence < 85%)
- **COMPLETED**: Validation created successfully
- **FAILED**: Processing failed after max attempts

### 3. Report Analysis

The engine analyzes reports to extract:

- **Data Points**: Nutritional values, chemical analysis, microbiological results
- **Claims**: Product claims that need validation
- **Certifications**: Identified certifications
- **Test Methods**: Laboratory test methods used
- **Sample Information**: Collection dates, batch numbers

### 4. Validation Rules

Rules are applied based on Brazilian regulatory standards (ANVISA, MAPA):

```typescript
Categories:
- Microbiological limits (coliforms, salmonella, etc.)
- Chemical limits (heavy metals, pesticides)
- Nutritional accuracy
- Data consistency checks
```

### 5. Confidence Scoring

Confidence is calculated based on:

- Base score: 100%
- HIGH severity findings: -20 points each
- MEDIUM severity findings: -10 points each
- LOW severity findings: -5 points each
- Auto-approval threshold: 85%

### 6. Analysis Findings

Each finding includes:

```typescript
{
  category: 'COMPLIANCE' | 'ACCURACY' | 'CONSISTENCY' | 'ANOMALY' | 'IMPROVEMENT',
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
  dataPoint: string,
  description: string,
  evidence?: string,
  suggestedAction?: string
}
```

## Usage

### Queue a Validation

```typescript
// Queue with normal priority
const queueId = await validationService.queueAutomatedValidation(
  reportId,
  productId,
  'NORMAL'
);

// Queue with urgent priority
const urgentQueueId = await validationService.queueAutomatedValidation(
  reportId,
  productId,
  'URGENT'
);
```

### Check Queue Status

```typescript
const status = await validationService.getAutomatedQueueStatus();
// Returns:
// {
//   totalItems: number,
//   byState: { QUEUED: 2, ANALYZING: 1, ... },
//   byPriority: { URGENT: 1, HIGH: 2, ... }
// }
```

### Get Queue Item Details

```typescript
const item = await validationService.getAutomatedQueueItem(queueId);
// Returns queue item with current state, attempts, errors, etc.
```

### Cancel Queued Validation

```typescript
const result = await validationService.cancelAutomatedValidation(queueId);
// Only works for items in QUEUED state
```

### Retry Failed Validation

```typescript
const result = await validationService.retryAutomatedValidation(queueId);
// Resets attempts and re-queues failed items
```

## Data Flow

1. **Report Upload**: Laboratory uploads analysis report
2. **Queue Request**: System queues validation with priority
3. **Processing**: Background processor picks up queued items
4. **Analysis**: Report is parsed and data extracted
5. **Rule Application**: Validation rules applied to data points
6. **Confidence Calculation**: Overall confidence score calculated
7. **Decision**:
   - Confidence ≥ 85%: Auto-approve and create validation
   - Confidence < 85%: Flag for manual review
8. **QR Generation**: Generate QR code for validated products
9. **Notification**: Alert relevant parties about outcome

## Validation Rules Engine

### Microbiological Limits (ANVISA RDC 331/2019)

- Aerobic Mesophiles: max 100,000 CFU/g
- Total Coliforms: max 1,000 CFU/g
- Thermotolerant Coliforms: max 100 CFU/g
- Salmonella: must be absent
- Listeria: must be absent

### Nutritional Consistency

- Macronutrient sum should not exceed 100%
- Caloric value should match calculated value (±10%)
- Values must be within reasonable ranges

### Data Quality Checks

- Detect placeholder values (0, 999, 9999)
- Flag unusually precise measurements
- Check for data entry errors

## Feedback Loop

The system includes a feedback mechanism for continuous improvement:

1. **Feedback Types**:
   - CORRECTION: Fix incorrect validation
   - CONFIRMATION: Confirm correct validation
   - DISPUTE: Challenge validation result
   - SUGGESTION: Propose improvements

2. **Feedback Status**:
   - PENDING: Awaiting review
   - REVIEWED: Under consideration
   - RESOLVED: Action taken

## Error Handling

- **Retry Logic**: Failed validations retry up to 3 times
- **Error Tracking**: Last error stored for debugging
- **Graceful Degradation**: Processing continues despite individual failures
- **Queue Persistence**: Queue maintained across system restarts

## Performance

- **Processing Interval**: Queue checked every 5 seconds
- **Concurrent Processing**: One item at a time (can be scaled)
- **Average Processing Time**: Tracked per validation
- **Queue Priority**: Ensures urgent items processed first

## Security Considerations

- **Access Control**: Only authorized users can queue validations
- **Data Validation**: All inputs sanitized and validated
- **Audit Trail**: All actions logged for compliance
- **Secure Communication**: All API calls use authenticated endpoints

## Future Enhancements

1. **Machine Learning Integration**
   - Train models on historical validation data
   - Improve accuracy of automated decisions
   - Predict validation outcomes

2. **Batch Processing**
   - Process multiple related products together
   - Bulk validation operations
   - Performance optimizations

3. **Advanced Analytics**
   - Trend analysis across validations
   - Identify common failure patterns
   - Predictive quality metrics

4. **Integration Extensions**
   - Direct laboratory system integration
   - Real-time report streaming
   - External validation services

## Testing

Access the test interface at: `/dashboard/test-automated-validation`

This allows you to:
- Queue test validations with different priorities
- Monitor queue status in real-time
- View example analysis outputs
- Test different workflow scenarios