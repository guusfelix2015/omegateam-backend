import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Password utility functions for hashing and comparing passwords using PostgreSQL
 */
export class PasswordUtils {
  /**
   * Hash a plain text password using PostgreSQL's crypt function
   * @param password - Plain text password
   * @returns Promise<string> - Hashed password
   */
  static async hash(password: string): Promise<string> {
    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const result = await prisma.$queryRaw<[{ hash: string }]>`
      SELECT crypt(${password}, gen_salt('bf', 12)) as hash
    `;
    return result[0].hash;
  }

  /**
   * Compare a plain text password with a hashed password using PostgreSQL
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Promise<boolean> - True if passwords match
   */
  static async compare(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    if (!password || !hashedPassword) {
      return false;
    }

    const result = await prisma.$queryRaw<[{ match: boolean }]>`
      SELECT (crypt(${password}, ${hashedPassword}) = ${hashedPassword}) as match
    `;
    return result[0].match;
  }

  /**
   * Check if a password is already hashed (starts with bcrypt hash format)
   * @param password - Password to check
   * @returns boolean - True if password appears to be hashed
   */
  static isHashed(password: string): boolean {
    // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
    return /^\$2[abxy]\$\d+\$/.test(password);
  }

  /**
   * Validate password strength
   * @param password - Plain text password
   * @returns object with validation result
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    // Optional: Add more strength requirements
    // if (!/[A-Z]/.test(password)) {
    //   errors.push('Password must contain at least one uppercase letter');
    // }

    // if (!/[a-z]/.test(password)) {
    //   errors.push('Password must contain at least one lowercase letter');
    // }

    // if (!/\d/.test(password)) {
    //   errors.push('Password must contain at least one number');
    // }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
