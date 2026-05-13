import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Attaches required roles to route metadata under key 'roles',
 * which RolesGuard reads at request time.
 *
 * Apply on any controller method or class that should be restricted
 * to specific roles, e.g. @Roles(UserRole.ADMIN).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
