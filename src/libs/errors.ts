import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isProd } from './env.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
  };
}

export function formatZodError(error: ZodError): string {
  return error.errors
    .map(err => {
      const path = err.path.length > 0 ? ` at ${err.path.join('.')}` : '';
      return `${err.message}${path}`;
    })
    .join(', ');
}

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const response: ErrorResponse = {
    error: {
      message: 'Internal Server Error',
      statusCode: 500,
    },
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    response.error.message = formatZodError(error);
    response.error.statusCode = 400;
    response.error.details = error.errors;
  }
  // Handle custom app errors
  else if (error instanceof AppError) {
    response.error.message = error.message;
    response.error.statusCode = error.statusCode;
  }
  // Handle Fastify validation errors
  else if (error.validation) {
    response.error.message = 'Validation error';
    response.error.statusCode = 400;
    response.error.details = error.validation;
  }
  // Handle other known errors
  else if (error.statusCode) {
    response.error.message = error.message;
    response.error.statusCode = error.statusCode;
  }

  // Include stack trace in development
  if (!isProd && error.stack) {
    response.error.stack = error.stack;
  }

  // Log error
  request.log.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        statusCode: response.error.statusCode,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    },
    'Request error'
  );

  await reply.status(response.error.statusCode).send(response);
}
