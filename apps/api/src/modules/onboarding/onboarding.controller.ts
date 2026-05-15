import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type.js';
import {
  OnboardingService,
  type OnboardingResult,
} from './onboarding.service.js';

/**
 * Onboarding endpoint under /api/v1/onboarding.
 * Used by: the frontend onboarding flow after the user creates their initial categories.
 */
@ApiTags('onboarding')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'onboarding', version: '1' })
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiOkResponse({
    description: 'Onboarding completed — onboardingCompleted is now true',
  })
  @ApiBadRequestResponse({ description: 'Fewer than 3 categories exist' })
  @ApiConflictResponse({ description: 'Onboarding was already completed' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async complete(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: OnboardingResult; meta: object }> {
    const result = await this.onboardingService.complete(user.userId);
    return { data: result, meta: {} };
  }
}
