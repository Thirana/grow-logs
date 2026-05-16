import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export type FlagItem = { key: string; enabled: boolean };

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private cache: Map<string, boolean> = new Map();
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.refreshCache();
  }

  async getAll(): Promise<FlagItem[]> {
    if (Date.now() < this.cacheExpiresAt) {
      return Array.from(this.cache.entries()).map(([key, enabled]) => ({
        key,
        enabled,
      }));
    }
    await this.refreshCache();
    return Array.from(this.cache.entries()).map(([key, enabled]) => ({
      key,
      enabled,
    }));
  }

  async refreshCache(): Promise<void> {
    const flags = await this.prisma.featureFlag.findMany();
    this.cache.clear();
    flags.forEach((f) => this.cache.set(f.key, f.enabled));
    this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;
  }

  async isEnabled(key: string): Promise<boolean> {
    const flags = await this.getAll();
    return flags.find((f) => f.key === key)?.enabled ?? false;
  }
}
