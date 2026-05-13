import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../types/authenticated-user.type.js';

/**
 * Reads @Roles(...) metadata via Reflector and rejects requests from
 * users whose role is not in the required list — returns false, which
 * NestJS translates to a 403.
 *
 * Routes without @Roles pass through unconditionally.
 * Used alongside JwtAuthGuard on admin-only routes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return required.includes(user.role);
  }
}
