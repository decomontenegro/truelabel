import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ValidationsService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement validation operations
}