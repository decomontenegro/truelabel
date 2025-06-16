import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractClaimsDto {
  @ApiProperty({ example: 'https://example.com/product-label.jpg' })
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class ParseReportDto {
  @ApiProperty({ example: 'https://lab.com/reports/analysis.pdf' })
  @IsUrl()
  @IsNotEmpty()
  reportUrl: string;

  @ApiProperty({ example: 'validation-uuid' })
  @IsString()
  @IsNotEmpty()
  validationId: string;
}

export class MatchClaimsDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'validation-uuid' })
  @IsString()
  @IsNotEmpty()
  validationId: string;
}

export class DetectAnomaliesDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}