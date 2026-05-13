import { UserRole } from '@prisma/client';

/**
 * Shape of req.user after JWT validation.
 *
 * Consumed by @CurrentUser() in controller params and passed into
 * service methods for ownership checks and role-based decisions.
 */
export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}
