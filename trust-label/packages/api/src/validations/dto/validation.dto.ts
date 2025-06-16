import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsDateString, 
  IsNumber, 
  IsObject,
  IsNotEmpty,
  Min,
  Max
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ValidationStatus, ClaimValidationStatus } from '@prisma/client';

export class CreateValidationDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'laboratory-uuid', required: false })
  @IsString()
  @IsOptional()
  laboratoryId?: string;

  @ApiProperty({ example: 'LAB-2024-001234' })
  @IsString()
  @IsNotEmpty()
  reportNumber: string;

  @ApiProperty({ example: 'https://lab.com/reports/2024-001234.pdf' })
  @IsString()
  @IsNotEmpty()
  reportUrl: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ example: { testMethod: 'HPLC', batchNumber: 'BATCH-001' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateValidationDto extends PartialType(CreateValidationDto) {
  @ApiProperty({ enum: ValidationStatus, required: false })
  @IsEnum(ValidationStatus)
  @IsOptional()
  status?: ValidationStatus;

  @ApiProperty({ example: { aiScore: 0.95 }, required: false })
  @IsObject()
  @IsOptional()
  aiAnalysis?: Record<string, any>;
}

export class UpdateClaimStatusDto {
  @ApiProperty({ enum: ClaimValidationStatus })
  @IsEnum(ClaimValidationStatus)
  status: ClaimValidationStatus;

  @ApiProperty({ example: '24.5', required: false })
  @IsString()
  @IsOptional()
  actualValue?: string;

  @ApiProperty({ example: 'Value within acceptable range', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({ example: 0.95, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ example: 'HPLC Analysis', required: false })
  @IsString()
  @IsOptional()
  methodology?: string;
}

export class ApprovalDto {
  @ApiProperty({ example: 'All claims validated successfully', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectionDto {
  @ApiProperty({ example: 'Incomplete documentation provided' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}