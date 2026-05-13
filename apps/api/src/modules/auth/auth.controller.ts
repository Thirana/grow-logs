import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { loginSchema, registerSchema } from '@grow-logs/schemas';
import type { LoginDto, RegisterDto } from '@grow-logs/schemas';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import { AuthService, LoginResponse } from './auth.service.js';

/**
 * Handles all unauthenticated auth routes under /api/v1/auth.
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
  ): Promise<LoginResponse> {
    return this.authService.login(dto);
  }
}
