import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../types/authenticated-user.type.js';

/**
 * Verifies the Bearer token signature on every protected request.
 * Throws at startup if JWT_SECRET is missing — a server that cannot
 * verify tokens should not run.
 *
 * Called automatically by JwtAuthGuard; validate() return value is
 * attached to req.user and consumed by @CurrentUser() and RolesGuard.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  /**
   * Maps JWT sub claim → userId (sub is the standard JWT identity field).
   * The returned object becomes req.user, read by @CurrentUser()
   * in every protected controller method.
   */
  validate(payload: { sub: string; role: UserRole }): AuthenticatedUser {
    return { userId: payload.sub, role: payload.role };
  }
}
