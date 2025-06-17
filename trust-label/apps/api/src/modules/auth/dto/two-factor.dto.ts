import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TwoFactorDto {
  @ApiProperty({ example: 'user-id' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsString()
  @IsOptional()
  backupCode?: string;
}

export class Enable2FADto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'JBSWY3DPEHPK3PXP' })
  @IsString()
  @IsNotEmpty()
  secret: string;
}