import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }

  async getReadiness(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'reachable' };
    } catch {
      throw new ServiceUnavailableException({
        message: 'Database not reachable',
        errorCode: 'DATABASE_NOT_READY',
      });
    }
  }
}
