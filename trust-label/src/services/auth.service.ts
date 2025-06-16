import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AppError } from '../middlewares/errorHandler';
import { sendEmail } from './email.service';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'BRAND' | 'LABORATORY' | 'PRESCRIBER';
  brandData?: {
    name: string;
    cnpj: string;
    website?: string;
    description?: string;
  };
  laboratoryData?: {
    name: string;
    cnpj: string;
    accreditation: string[];
    certifications: string[];
    specialties: string[];
  };
  prescriberData?: {
    profession: string;
    license: string;
    specialties: string[];
  };
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private static generateToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  private static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
    );
  }

  static async register(data: RegisterData) {
    const { email, password, name, role } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and related entity in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      });

      // Create role-specific entity
      if (role === 'BRAND' && data.brandData) {
        await tx.brand.create({
          data: {
            userId: user.id,
            ...data.brandData,
          },
        });
      } else if (role === 'LABORATORY' && data.laboratoryData) {
        await tx.laboratory.create({
          data: {
            userId: user.id,
            ...data.laboratoryData,
          },
        });
      } else if (role === 'PRESCRIBER' && data.prescriberData) {
        await tx.prescriber.create({
          data: {
            userId: user.id,
            name,
            ...data.prescriberData,
          },
        });
      }

      return user;
    });

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Bem-vindo ao TRUST LABEL',
      template: 'welcome',
      data: { name },
    });

    // Generate tokens
    const accessToken = this.generateToken(result.id, result.email, result.role);
    const refreshToken = this.generateRefreshToken(result.id);

    // Save refresh token
    await prisma.session.create({
      data: {
        userId: result.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info(`New user registered: ${email} with role ${role}`);

    return {
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = this.generateToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
      },
    });

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }

      // Check if refresh token exists in database
      const session = await prisma.session.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!session) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const accessToken = this.generateToken(
        session.user.id,
        session.user.email,
        session.user.role
      );

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  static async logout(userId: string, refreshToken: string) {
    // Delete the refresh token
    await prisma.session.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    logger.info(`User logged out: ${userId}`);
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token with expiry
    await prisma.session.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Redefinir sua senha - TRUST LABEL',
      template: 'reset-password',
      data: {
        name: user.name,
        resetUrl,
      },
    });

    logger.info(`Password reset requested for: ${email}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  static async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const session = await prisma.session.findFirst({
      where: {
        token: hashedToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and delete reset token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { password: hashedPassword },
      }),
      prisma.session.delete({
        where: { id: session.id },
      }),
    ]);

    logger.info(`Password reset successful for user: ${session.user.email}`);

    return { message: 'Password reset successful' };
  }
}