import { IsString, IsOptional, IsArray, IsEnum, IsUrl, Length, IsNotEmpty } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ProductStatus, ClaimType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Whey Protein' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High-quality whey protein powder', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '7891234567890' })
  @IsString()
  @Length(8, 14)
  barcode: string;

  @ApiProperty({ example: 'SKU-WHEY-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'Supplements' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: ['https://example.com/image1.jpg'], required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class CreateClaimDto {
  @ApiProperty({ enum: ClaimType })
  @IsEnum(ClaimType)
  type: ClaimType;

  @ApiProperty({ example: 'Protein Content' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '25' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'g', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 'Per 30g serving', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}