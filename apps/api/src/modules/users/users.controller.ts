import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { updateUserSchema } from '@grow-logs/schemas';
import type { UpdateUserDto } from '@grow-logs/schemas';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import { ZodValidationPipe } from '../../common/pipes/index.js';
import { UsersService, type UserProfile } from './users.service.js';

/**
 * User profile endpoints under /api/v1/users.
 * All routes require a valid JWT — JwtAuthGuard is applied at the class level.
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: "Get the authenticated user's profile" })
  @ApiOkResponse({ description: 'User profile returned' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: UserProfile; meta: object }> {
    const profile = await this.usersService.findById(user.userId);
    return { data: profile, meta: {} };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update the authenticated user's email address" })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'newemail@example.com',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Profile updated — returns updated user' })
  @ApiConflictResponse({
    description: 'Email already in use by another account',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto,
  ): Promise<{ data: UserProfile; meta: object }> {
    const profile = await this.usersService.updateEmail(user.userId, dto);
    return { data: profile, meta: {} };
  }
}
