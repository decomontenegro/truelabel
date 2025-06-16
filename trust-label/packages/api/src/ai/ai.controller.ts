import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ExtractClaimsDto,
  ParseReportDto,
  MatchClaimsDto,
  DetectAnomaliesDto,
} from './dto/ai.dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('extract-claims')
  @Roles(UserRole.BRAND, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extract claims from product image using AI' })
  extractClaims(@Body() extractClaimsDto: ExtractClaimsDto) {
    return this.aiService.extractClaimsFromImage(
      extractClaimsDto.imageUrl,
      extractClaimsDto.productId,
    );
  }

  @Post('parse-report')
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parse laboratory report using AI' })
  parseReport(@Body() parseReportDto: ParseReportDto) {
    return this.aiService.parseLabReport(
      parseReportDto.reportUrl,
      parseReportDto.validationId,
    );
  }

  @Post('match-claims')
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Match product claims with lab report data' })
  matchClaims(@Body() matchClaimsDto: MatchClaimsDto) {
    return this.aiService.matchClaimsWithReport(
      matchClaimsDto.productId,
      matchClaimsDto.validationId,
    );
  }

  @Post('detect-anomalies')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detect anomalies in product validation data' })
  detectAnomalies(@Body() detectAnomaliesDto: DetectAnomaliesDto) {
    return this.aiService.detectAnomalies(detectAnomaliesDto.productId);
  }

  @Get('job/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI job status' })
  getJobStatus(@Param('id') id: string) {
    return this.aiService.getJobStatus(id);
  }

  @Post('confidence-score')
  @Roles(UserRole.LABORATORY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate confidence score for validation' })
  calculateConfidence(@Body() validationData: any) {
    return this.aiService.calculateConfidenceScore(validationData);
  }
}