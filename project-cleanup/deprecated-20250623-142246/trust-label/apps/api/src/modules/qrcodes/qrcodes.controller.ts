import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QrcodesService } from './qrcodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('qrcodes')
@Controller('qrcodes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QrcodesController {
  constructor(private readonly qrcodesService: QrcodesService) {}

  // TODO: Implement QR code endpoints
}