import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { 
  verifyPassword, 
  generateTokens, 
  verifyTwoFactorToken,
  generateTwoFactorSecret,
  verifyBackupCode,
} from '@trust-label/auth';
import { UserRole } from '@trust-label/types';
import { LoginDto, RegisterDto, RefreshTokenDto, TwoFactorDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Check if 2FA is enabled
    const metadata = user.metadata as any;
    if (metadata?.twoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        userId: user.id,
      };
    }

    return this.generateAuthResponse(user);
  }

  async loginWith2FA(twoFactorDto: TwoFactorDto) {
    const user = await this.usersService.findById(twoFactorDto.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    const metadata = user.metadata as any;
    if (!metadata?.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Try token first, then backup code
    let isValid = false;
    
    if (twoFactorDto.token) {
      isValid = verifyTwoFactorToken(twoFactorDto.token, metadata.twoFactorSecret);
    } else if (twoFactorDto.backupCode) {
      isValid = await verifyBackupCode(user.id, twoFactorDto.backupCode);
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create({
      ...registerDto,
      role: registerDto.role || UserRole.CONSUMER,
    });

    return this.generateAuthResponse(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      const user = await this.usersService.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if session is still valid
      const session = await this.prisma.session.findUnique({
        where: { 
          token: refreshTokenDto.refreshToken,
          userId: user.id,
          isActive: true,
        },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired');
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string) {
    await this.prisma.session.update({
      where: { token, userId },
      data: { isActive: false },
    });

    return { message: 'Logged out successfully' };
  }

  async enable2FA(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = await generateTwoFactorSecret(userId, user.email);
    return {
      secret: secret.base32,
      qrCode: secret.qr_code,
    };
  }

  private async generateAuthResponse(user: any) {
    const sessionId = crypto.randomUUID();
    
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      sessionId,
    });

    // Create session
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: tokens.refreshToken,
        ipAddress: '0.0.0.0', // Should be from request
        userAgent: 'API Client', // Should be from request
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }
}