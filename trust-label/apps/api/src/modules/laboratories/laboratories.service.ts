import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LaboratoriesService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement laboratory CRUD operations
}