import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ValidationsService } from './validations.service';
import { 
  CreateValidationDto, 
  UpdateValidationDto, 
  UpdateClaimStatusDto,
  ApprovalDto,
  RejectionDto 
} from './dto/validation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User, UserRole, ValidationStatus } from '@prisma/client';

@ApiTags('validations')
@Controller('validations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ValidationsController {
  constructor(private readonly validationsService: ValidationsService) {}

  @Post()
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new validation' })
  create(@Body() createValidationDto: CreateValidationDto, @CurrentUser() user: User) {
    return this.validationsService.create(createValidationDto, user);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all validations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ValidationStatus })
  @ApiQuery({ name: 'laboratoryId', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: String })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: ValidationStatus,
    @Query('laboratoryId') laboratoryId?: string,
    @Query('productId') productId?: string,
  ) {
    const skip = (page - 1) * limit;
    return this.validationsService.findAll({
      skip,
      take: limit,
      status,
      laboratoryId,
      productId,
    });
  }

  @Get('product/:productId')
  @Public()
  @ApiOperation({ summary: 'Get validations for a product' })
  getByProduct(@Param('productId') productId: string) {
    return this.validationsService.getValidationsByProduct(productId);
  }

  @Get('product/:productId/active')
  @Public()
  @ApiOperation({ summary: 'Get active validation for a product' })
  getActiveValidation(@Param('productId') productId: string) {
    return this.validationsService.getActiveValidation(productId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get validation by ID' })
  findOne(@Param('id') id: string) {
    return this.validationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update validation' })
  update(
    @Param('id') id: string,
    @Body() updateValidationDto: UpdateValidationDto,
    @CurrentUser() user: User,
  ) {
    return this.validationsService.update(id, updateValidationDto, user);
  }

  @Post(':id/claims/:claimId')
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update claim validation status' })
  updateClaimStatus(
    @Param('id') id: string,
    @Param('claimId') claimId: string,
    @Body() updateClaimStatusDto: UpdateClaimStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.validationsService.updateClaimStatus(id, claimId, updateClaimStatusDto, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit validation for review' })
  submitForReview(@Param('id') id: string, @CurrentUser() user: User) {
    return this.validationsService.submitForReview(id, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve validation' })
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.validationsService.approve(id, user);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject validation' })
  reject(
    @Param('id') id: string,
    @Body() rejectionDto: RejectionDto,
    @CurrentUser() user: User,
  ) {
    return this.validationsService.reject(id, rejectionDto.reason, user);
  }
}