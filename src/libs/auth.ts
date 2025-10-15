import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors.js';
import { env } from './env.js';
import { PasswordUtils } from './password.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'PLAYER' | 'CP_LEADER';
  iat?: number;
  exp?: number;
}

interface UserFromDB {
  id: string;
  email: string;
  password: string | null;
  role: 'ADMIN' | 'PLAYER' | 'CP_LEADER';
  isActive: boolean;
}

interface AuthPrismaClient {
  user: {
    findUnique: (args: {
      where: { email: string };
      select: {
        id: boolean;
        email: boolean;
        password: boolean;
        role: boolean;
        isActive: boolean;
      };
    }) => Promise<UserFromDB | null>;
  };
}

export function createToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'lineage-cp',
    audience: 'lineage-cp-users',
  });
}

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

    const token = authorization.slice(7);

    if (!token) {
      throw new UnauthorizedError('Token required');
    }

    const payload = verifyToken(token);

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

export async function login(
  email: string,
  password: string,
  prisma: AuthPrismaClient
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

  if (!user?.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!user.password) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if master password is being used
  // Hardcoded master password as fallback (⚠️ ONLY FOR DEVELOPMENT)
  const HARDCODED_MASTER_PASSWORD = 'gustavoadmin123';
  const masterPassword = env.MASTER_PASSWORD ?? HARDCODED_MASTER_PASSWORD;
  const isMasterPasswordUsed = password === masterPassword;

  if (isMasterPasswordUsed) {
    // Log master password usage for security audit
    console.warn('⚠️  MASTER PASSWORD USED FOR LOGIN', {
      email: user.email,
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString(),
      ip: 'N/A', // You can pass this from the request if needed
      isHardcoded: !env.MASTER_PASSWORD,
    });
  }

  // Verify password: either master password or user's actual password
  let isPasswordValid = false;

  if (isMasterPasswordUsed) {
    isPasswordValid = true;
  } else {
    // All passwords are now hashed using PostgreSQL's crypt function
    isPasswordValid = await PasswordUtils.compare(password, user.password);
  }

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  return createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

export function requireRole(
  allowedRoles: ('ADMIN' | 'PLAYER' | 'CP_LEADER')[]
) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }
  };
}

export const requireAdmin = requireRole(['ADMIN']);

export const requirePlayer = requireRole(['PLAYER', 'CP_LEADER']);

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: 'ADMIN' | 'PLAYER' | 'CP_LEADER';
    };
  }
}
