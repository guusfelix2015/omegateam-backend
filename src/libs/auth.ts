import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors.js';
import { env } from './env.js';

// JWT payload interface
interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'PLAYER';
  iat?: number;
  exp?: number;
}

// Create JWT token
export function createToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'lineage-cp',
    audience: 'lineage-cp-users',
  });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'lineage-cp',
      audience: 'lineage-cp-users',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

// Authentication middleware
export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedError('Authorization header required');
    }

    if (!authorization.startsWith('Bearer ')) {
      throw new UnauthorizedError('Bearer token required');
    }

    const token = authorization.slice(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('Token required');
    }

    const payload = verifyToken(token);

    // Add user info to request context
    request.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

// Login function - verify against database
export async function login(
  email: string,
  password: string,
  prisma: any
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // In a real app, you would hash the password and compare
  // For demo purposes, we're doing plain text comparison
  if (user.password !== password) {
    throw new UnauthorizedError('Invalid credentials');
  }

  return createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

// Role-based authorization middleware
export function requireRole(allowedRoles: ('ADMIN' | 'PLAYER')[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }
  };
}

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole(['ADMIN']);

// Extend FastifyRequest type to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: 'ADMIN' | 'PLAYER';
    };
  }
}
