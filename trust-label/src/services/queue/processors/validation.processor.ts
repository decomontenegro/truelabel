import { Job } from 'bull';
import { prisma } from '../../../server';
import { AIService } from '../../ai.service';
import { sendEmail } from '../../email.service';
import { logger } from '../../../utils/logger';
import { io } from '../../../server';

export async function validationProcessor(job: Job) {
  const { productId, validationId } = job.data;

  try {
    logger.info(`Processing validation ${validationId} for product ${productId}`);

    // Get product and claims
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        claims: true,
        brand: {
          include: { user: true },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Update validation status
    await prisma.validation.update({
      where: { id: validationId },
      data: { status: 'IN_REVIEW' },
    });

    // Emit status update
    io.to(`product-${productId}`).emit('validation-status', {
      validationId,
      status: 'IN_REVIEW',
    });

    // Perform AI analysis
    const aiAnalysis = await AIService.analyzeProductClaims({
      id: product.id,
      name: product.name,
      category: product.category,
      claims: product.claims.map(claim => ({
        type: claim.type,
        category: claim.category,
        value: claim.value,
        unit: claim.unit,
      })),
    });

    // Calculate validation status based on AI analysis
    const hasRejected = aiAnalysis.summary.rejectedItems > 0;
    const hasWarnings = aiAnalysis.summary.warningItems > 0;
    
    let validationStatus: 'VALIDATED' | 'VALIDATED_WITH_REMARKS' | 'REJECTED';
    if (hasRejected) {
      validationStatus = 'REJECTED';
    } else if (hasWarnings) {
      validationStatus = 'VALIDATED_WITH_REMARKS';
    } else {
      validationStatus = 'VALIDATED';
    }

    // Update validation with results
    const updatedValidation = await prisma.validation.update({
      where: { id: validationId },
      data: {
        status: validationStatus,
        aiConfidence: aiAnalysis.confidence,
        aiAnalysis: aiAnalysis as any,
        categories: aiAnalysis.categories as any,
        summary: aiAnalysis.summary as any,
        validatedAt: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      include: {
        product: true,
      },
    });

    // Update product status
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'VALIDATED' },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: product.brand.userId,
        action: 'VALIDATION_COMPLETED',
        entity: 'VALIDATION',
        entityId: validationId,
        metadata: {
          productId,
          productName: product.name,
          status: validationStatus,
          aiConfidence: aiAnalysis.confidence,
        },
      },
    });

    // Send email notification
    await sendEmail({
      to: product.brand.user.email,
      subject: `Validação Concluída - ${product.name}`,
      template: 'validation-complete',
      data: {
        brandName: product.brand.name,
        productName: product.name,
        status: validationStatus === 'VALIDATED' ? 'Aprovado' :
               validationStatus === 'VALIDATED_WITH_REMARKS' ? 'Aprovado com Ressalvas' :
               'Reprovado',
        statusClass: validationStatus === 'VALIDATED' ? 'approved' :
                    validationStatus === 'VALIDATED_WITH_REMARKS' ? 'warning' :
                    'rejected',
        aiConfidence: aiAnalysis.confidence,
        qrCodeId: product.qrCodes?.[0]?.code || 'N/A',
        reportUrl: `${process.env.FRONTEND_URL}/validations/${validationId}`,
      },
    });

    // Emit completion event
    io.to(`product-${productId}`).emit('validation-complete', {
      validationId,
      status: validationStatus,
      aiAnalysis,
    });

    logger.info(`Validation ${validationId} completed with status ${validationStatus}`);

    return {
      validationId,
      status: validationStatus,
      aiConfidence: aiAnalysis.confidence,
    };
  } catch (error) {
    logger.error(`Validation processing failed for ${validationId}:`, error);

    // Update validation status to failed
    await prisma.validation.update({
      where: { id: validationId },
      data: { status: 'REJECTED' },
    });

    // Emit error event
    io.to(`product-${productId}`).emit('validation-error', {
      validationId,
      error: 'Validation processing failed',
    });

    throw error;
  }
}