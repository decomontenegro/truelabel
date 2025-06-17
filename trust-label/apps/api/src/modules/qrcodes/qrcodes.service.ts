import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class QrcodesService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement QR code CRUD operations
}