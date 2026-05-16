import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FeatureFlagsService, type FlagItem } from './feature-flags.service.js';

@ApiTags('feature-flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'feature-flags', version: '1' })
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'List all feature flags and their enabled state' })
  @ApiOkResponse({ description: 'Flag list returned' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  async getAll(): Promise<{ data: FlagItem[]; meta: object }> {
    const flags = await this.featureFlagsService.getAll();
    return { data: flags, meta: {} };
  }
}
