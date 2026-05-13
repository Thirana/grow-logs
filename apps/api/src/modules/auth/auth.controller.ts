import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { registerSchema } from '@grow-logs/schemas';
import type { RegisterDto } from '@grow-logs/schemas';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import { AuthService } from './auth.service.js';

/**
 * Handles all unauthenticated auth routes under /v1/auth.
 * No JwtAuthGuard applied here — these endpoints are intentionally public.
 *
 * Delegates all business logic to AuthService.
 */
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(dto);
  }
}
