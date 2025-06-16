import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateValidationDto, UpdateValidationDto, UpdateClaimStatusDto } from './dto/validation.dto';
import { User, UserRole, ValidationStatus, ClaimValidationStatus } from '@prisma/client';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ValidationsService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async create(createValidationDto: CreateValidationDto, user: User) {
    // Check if user is a laboratory
    if (user.role !== UserRole.LABORATORY && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only laboratories can create validations');
    }

    const laboratory = await this.prisma.laboratory.findUnique({
      where: { userId: user.id },
    });

    if (!laboratory && user.role !== UserRole.ADMIN) {
      throw new NotFoundException('Laboratory profile not found');
    }

    // Verify product exists
    const product = await this.productsService.findOne(createValidationDto.productId);

    // Create validation
    const validation = await this.prisma.validation.create({
      data: {
        productId: createValidationDto.productId,
        laboratoryId: createValidationDto.laboratoryId || laboratory.id,
        reportNumber: createValidationDto.reportNumber,
        reportUrl: createValidationDto.reportUrl,
        validFrom: new Date(createValidationDto.validFrom),
        validUntil: new Date(createValidationDto.validUntil),
        metadata: createValidationDto.metadata || {},
        status: ValidationStatus.PENDING,
      },
      include: {
        product: true,
        laboratory: true,
      },
    });

    // Update product status
    await this.prisma.product.update({
      where: { id: product.id },
      data: { status: 'PENDING_VALIDATION' },
    });

    return validation;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: ValidationStatus;
    laboratoryId?: string;
    productId?: string;
  }) {
    const { skip = 0, take = 10, status, laboratoryId, productId } = params;

    const where = {
      ...(status && { status }),
      ...(laboratoryId && { laboratoryId }),
      ...(productId && { productId }),
    };

    const [validations, total] = await Promise.all([
      this.prisma.validation.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              brand: true,
            },
          },
          laboratory: true,
          _count: {
            select: {
              claims: true,
            },
          },
        },
      }),
      this.prisma.validation.count({ where }),
    ]);

    return {
      data: validations,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        perPage: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const validation = await this.prisma.validation.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            brand: true,
            claims: true,
          },
        },
        laboratory: true,
        claims: {
          include: {
            claim: true,
          },
        },
        certificates: true,
      },
    });

    if (!validation) {
      throw new NotFoundException('Validation not found');
    }

    return validation;
  }

  async update(id: string, updateValidationDto: UpdateValidationDto, user: User) {
    const validation = await this.findOne(id);

    // Check permissions
    if (user.role === UserRole.LABORATORY) {
      const laboratory = await this.prisma.laboratory.findUnique({
        where: { userId: user.id },
      });

      if (validation.laboratoryId !== laboratory?.id) {
        throw new ForbiddenException('You can only update your own validations');
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const updated = await this.prisma.validation.update({
      where: { id },
      data: {
        ...updateValidationDto,
        ...(updateValidationDto.validFrom && { validFrom: new Date(updateValidationDto.validFrom) }),
        ...(updateValidationDto.validUntil && { validUntil: new Date(updateValidationDto.validUntil) }),
      },
      include: {
        product: true,
        laboratory: true,
      },
    });

    // Update product status if validation is approved
    if (updated.status === ValidationStatus.VALIDATED) {
      await this.prisma.product.update({
        where: { id: updated.productId },
        data: { status: 'VALIDATED' },
      });
    }

    return updated;
  }

  async updateClaimStatus(
    validationId: string,
    claimId: string,
    updateClaimStatusDto: UpdateClaimStatusDto,
    user: User,
  ) {
    const validation = await this.findOne(validationId);

    // Check permissions
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.LABORATORY) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check if claim exists for this product
    const claim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        productId: validation.productId,
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found for this product');
    }

    // Create or update validation claim
    return this.prisma.validationClaim.upsert({
      where: {
        validationId_claimId: {
          validationId,
          claimId,
        },
      },
      create: {
        validationId,
        claimId,
        ...updateClaimStatusDto,
        confidence: updateClaimStatusDto.confidence || 0.95,
      },
      update: updateClaimStatusDto,
      include: {
        claim: true,
      },
    });
  }

  async submitForReview(id: string, user: User) {
    const validation = await this.findOne(id);

    if (validation.status !== ValidationStatus.PENDING) {
      throw new BadRequestException('Only pending validations can be submitted for review');
    }

    // Check if all claims have been validated
    const product = await this.prisma.product.findUnique({
      where: { id: validation.productId },
      include: {
        claims: true,
      },
    });

    const validatedClaims = await this.prisma.validationClaim.count({
      where: { validationId: id },
    });

    if (validatedClaims < product.claims.length) {
      throw new BadRequestException('All claims must be validated before submission');
    }

    return this.prisma.validation.update({
      where: { id },
      data: { status: ValidationStatus.IN_REVIEW },
    });
  }

  async approve(id: string, user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can approve validations');
    }

    const validation = await this.findOne(id);

    if (validation.status !== ValidationStatus.IN_REVIEW) {
      throw new BadRequestException('Only validations in review can be approved');
    }

    // Check if there are any remarks
    const remarksCount = await this.prisma.validationClaim.count({
      where: {
        validationId: id,
        status: ClaimValidationStatus.VALIDATED_WITH_REMARKS,
      },
    });

    const status = remarksCount > 0 
      ? ValidationStatus.VALIDATED_WITH_REMARKS 
      : ValidationStatus.VALIDATED;

    const updated = await this.prisma.validation.update({
      where: { id },
      data: { status },
      include: {
        product: true,
      },
    });

    // Update product status
    await this.prisma.product.update({
      where: { id: updated.productId },
      data: { status: 'VALIDATED' },
    });

    // TODO: Generate QR code
    // TODO: Send notification to brand

    return updated;
  }

  async reject(id: string, reason: string, user: User) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can reject validations');
    }

    const validation = await this.findOne(id);

    if (validation.status !== ValidationStatus.IN_REVIEW) {
      throw new BadRequestException('Only validations in review can be rejected');
    }

    const updated = await this.prisma.validation.update({
      where: { id },
      data: {
        status: ValidationStatus.REJECTED,
        metadata: {
          ...validation.metadata,
          rejectionReason: reason,
          rejectedBy: user.id,
          rejectedAt: new Date(),
        },
      },
    });

    // Update product status
    await this.prisma.product.update({
      where: { id: updated.productId },
      data: { status: 'DRAFT' },
    });

    // TODO: Send notification to brand

    return updated;
  }

  async getValidationsByProduct(productId: string) {
    return this.prisma.validation.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        laboratory: true,
        claims: {
          include: {
            claim: true,
          },
        },
      },
    });
  }

  async getActiveValidation(productId: string) {
    return this.prisma.validation.findFirst({
      where: {
        productId,
        status: {
          in: [ValidationStatus.VALIDATED, ValidationStatus.VALIDATED_WITH_REMARKS],
        },
        validUntil: { gte: new Date() },
      },
      orderBy: { validFrom: 'desc' },
      include: {
        laboratory: true,
        claims: {
          include: {
            claim: true,
          },
        },
        certificates: true,
      },
    });
  }
}