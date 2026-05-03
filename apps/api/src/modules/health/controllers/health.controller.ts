import { Controller, Get } from '@nestjs/common';
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
}
