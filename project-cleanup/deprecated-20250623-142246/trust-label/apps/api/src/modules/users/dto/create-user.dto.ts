import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@trust-label/types';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+5511999999999' })
  @IsPhoneNumber('BR')
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: UserRole.CONSUMER, enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'company-id' })
  @IsString()
  @IsOptional()
  companyId?: string;
}