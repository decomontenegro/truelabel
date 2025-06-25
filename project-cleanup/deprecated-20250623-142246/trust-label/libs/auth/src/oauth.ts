import { prisma } from '@trust-label/database';
import { UserRole } from '@trust-label/types';
import { generateTokens } from './jwt';
import crypto from 'crypto';

export interface OAuthProfile {
  provider: 'google' | 'facebook' | 'github' | 'linkedin';
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified: boolean;
}

export async function handleOAuthLogin(profile: OAuthProfile) {
  // Check if user exists with this email
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  });
  
  if (user) {
    // Update user with OAuth info if not already linked
    const metadata = (user.metadata as any) || {};
    if (!metadata.oauthProviders) {
      metadata.oauthProviders = {};
    }
    
    if (!metadata.oauthProviders[profile.provider]) {
      metadata.oauthProviders[profile.provider] = {
        id: profile.id,
        linkedAt: new Date(),
      };
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          metadata,
          emailVerified: profile.verified || user.emailVerified,
          avatarUrl: profile.picture || user.avatarUrl,
        },
      });
    }
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        password: generateRandomPassword(), // User can set password later
        role: UserRole.CONSUMER, // Default role
        emailVerified: profile.verified,
        avatarUrl: profile.picture,
        metadata: {
          oauthProviders: {
            [profile.provider]: {
              id: profile.id,
              linkedAt: new Date(),
            },
          },
        },
      },
    });
    
    // Send welcome email
    // await sendWelcomeEmail(user.email, user.name);
  }
  
  // Create session
  const sessionId = crypto.randomUUID();
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId || undefined,
    sessionId,
  });
  
  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      token: tokens.refreshToken,
      ipAddress: '0.0.0.0', // Should be passed from request
      userAgent: 'OAuth Login', // Should be passed from request
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });
  
  return {
    user,
    tokens,
  };
}

export async function unlinkOAuthProvider(
  userId: string,
  provider: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.metadata) {
    throw new Error('User not found');
  }
  
  const metadata = user.metadata as any;
  if (metadata.oauthProviders && metadata.oauthProviders[provider]) {
    delete metadata.oauthProviders[provider];
    
    await prisma.user.update({
      where: { id: userId },
      data: { metadata },
    });
  }
}

export async function getLinkedProviders(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.metadata) {
    return [];
  }
  
  const metadata = user.metadata as any;
  return Object.keys(metadata.oauthProviders || {});
}

// OAuth state management for CSRF protection
const oauthStates = new Map<string, { provider: string; timestamp: number }>();

export function generateOAuthState(provider: string): string {
  const state = crypto.randomBytes(32).toString('base64url');
  oauthStates.set(state, {
    provider,
    timestamp: Date.now(),
  });
  
  // Clean old states
  cleanOldStates();
  
  return state;
}

export function verifyOAuthState(state: string, provider: string): boolean {
  const stateData = oauthStates.get(state);
  
  if (!stateData || stateData.provider !== provider) {
    return false;
  }
  
  // Check if state is not too old (15 minutes)
  const isValid = Date.now() - stateData.timestamp < 15 * 60 * 1000;
  
  // Delete state after verification
  oauthStates.delete(state);
  
  return isValid;
}

function cleanOldStates(): void {
  const now = Date.now();
  const timeout = 15 * 60 * 1000; // 15 minutes
  
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.timestamp > timeout) {
      oauthStates.delete(state);
    }
  }
}

function generateRandomPassword(): string {
  return crypto.randomBytes(32).toString('base64');
}

// OAuth provider configurations
export const oauthConfigs = {
  google: {
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  facebook: {
    authorizationURL: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/v12.0/oauth/access_token',
    userInfoURL: 'https://graph.facebook.com/me',
    scope: 'email public_profile',
  },
  github: {
    authorizationURL: 'https://github.com/login/oauth/authorize',
    tokenURL: 'https://github.com/login/oauth/access_token',
    userInfoURL: 'https://api.github.com/user',
    scope: 'user:email',
  },
  linkedin: {
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoURL: 'https://api.linkedin.com/v2/me',
    scope: 'r_liteprofile r_emailaddress',
  },
};