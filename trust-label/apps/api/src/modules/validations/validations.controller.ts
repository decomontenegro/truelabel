import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ValidationsService } from './validations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('validations')
@Controller('validations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ValidationsController {
  constructor(private readonly validationsService: ValidationsService) {}

  // TODO: Implement validation endpoints
}