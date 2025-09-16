-- Migration to hash existing plain text passwords
-- This migration will update any plain text passwords to bcrypt hashes

-- Install pgcrypto extension if not exists (for crypt function)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update existing plain text passwords to bcrypt hashes
-- Only update passwords that don't start with $2a$, $2b$, $2x$, or $2y$ (bcrypt format)
UPDATE "users"
SET password = crypt(password, gen_salt('bf', 12))
WHERE password IS NOT NULL
  AND password NOT LIKE '$2a$%'
  AND password NOT LIKE '$2b$%'
  AND password NOT LIKE '$2x$%'
  AND password NOT LIKE '$2y$%';

-- Add a comment to track this migration
COMMENT ON COLUMN "users".password IS 'Passwords are hashed using bcrypt with 12 salt rounds';
