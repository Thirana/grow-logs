import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from '@grow-logs/schemas';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from '@grow-logs/schemas';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import { AuthService, LoginResponse } from './auth.service.js';

/**
 * Handles all auth routes under /api/v1/auth.
 * Public endpoints have no guard. change-password requires JwtAuthGuard.
 *
 * Delegates all business logic to AuthService.
 */
@ApiTags('auth')
@Throttle({ auth: { ttl: 60_000, limit: 5 } })
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: {
          type: 'string',
          minLength: 8,
          example: 'SecurePass1!',
          description: 'Must contain a number and a special character',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User registered — verification email sent',
  })
  @ApiConflictResponse({ description: 'Email already registered' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in and receive a JWT access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', example: 'SecurePass1!' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login successful — returns access token and user profile',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or email not verified',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
  ): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verify an email address using the token from the verification email',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
          description: 'JWT emailed to the user on registration or resend',
          example: 'eyJhbGci...',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Email verified — user can now log in' })
  @ApiUnauthorizedResponse({ description: 'Token is invalid or expired' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend the verification email',
    description:
      'Always returns 200 regardless of whether the email is registered — prevents user enumeration.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
    },
  })
  @ApiOkResponse({
    description:
      'Request acknowledged — if the email is registered and unverified a new link has been sent',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async resendVerification(
    @Body(new ZodValidationPipe(resendVerificationSchema))
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(dto.email);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change the authenticated user's password" })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', example: 'OldPass1!' },
        newPassword: {
          type: 'string',
          minLength: 8,
          example: 'NewPass1!',
          description:
            'Must contain a number and a special character, and differ from the current password',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiUnauthorizedResponse({
    description: 'Current password is incorrect or JWT missing/invalid',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded — max 5 requests per minute',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.userId, dto);
  }
}
