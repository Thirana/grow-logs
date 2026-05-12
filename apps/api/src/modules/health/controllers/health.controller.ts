import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { HealthService } from '../services/health.service.js';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({
    summary: 'Liveness check — reports whether the process is up',
  })
  @ApiOkResponse({ description: 'Process is alive' })
  getLiveness(): { status: string; uptime: number } {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check — reports whether the app can serve traffic',
  })
  @ApiOkResponse({ description: 'App is ready and database is reachable' })
  @ApiServiceUnavailableResponse({ description: 'Database not reachable' })
  async getReadiness(): Promise<{ status: string; db: string }> {
    return this.healthService.getReadiness();
  }

  // TODO: remove before going to production
  @Get('test-error')
  @ApiOperation({ summary: 'Throws a 500 to verify Sentry error capture' })
  async testError(): Promise<never> {
    Sentry.captureException(
      new Error('Sentry test error — local dev verification'),
    );
    await Sentry.flush(3000);
    throw new InternalServerErrorException('Sentry test error');
  }
}
