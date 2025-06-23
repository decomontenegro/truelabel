import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LaboratoriesService } from './laboratories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('laboratories')
@Controller('laboratories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LaboratoriesController {
  constructor(private readonly laboratoriesService: LaboratoriesService) {}

  // TODO: Implement laboratory endpoints
}