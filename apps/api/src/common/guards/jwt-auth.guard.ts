import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Wraps Passport's 'jwt' strategy and converts its callback-style
 * result into a thrown UnauthorizedException on any auth failure.
 *
 * Applied with @UseGuards(JwtAuthGuard) on every protected route.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
