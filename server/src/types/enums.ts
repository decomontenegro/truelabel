// Enums temporários até regenerar o Prisma
export enum ValidationQueueStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ValidationQueuePriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  NORMAL = 'NORMAL',
  LOW = 'LOW'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  BRAND = 'BRAND',
  LABORATORY = 'LABORATORY',
  USER = 'USER'
}