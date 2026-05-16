import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { type AdminUserFiltersDto } from '@grow-logs/schemas';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service.js';

export type AdminUserItem = {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
};

export type AdminUserListResult = {
  items: AdminUserItem[];
  total: number;
};

export type FlagToggleResult = {
  key: string;
  enabled: boolean;
  updatedAt: Date;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  async getUsers(filters: AdminUserFiltersDto): Promise<AdminUserListResult> {
    const { page, limit, role, subscriptionStatus } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(role ? { role } : {}),
      ...(subscriptionStatus ? { subscriptionStatus } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isEmailVerified: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users, total };
  }

  async toggleFlag(key: string, enabled: boolean): Promise<FlagToggleResult> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
      select: { id: true },
    });

    if (!flag) throw new NotFoundException(`Feature flag "${key}" not found`);

    const updated = await this.prisma.featureFlag.update({
      where: { key },
      data: { enabled },
      select: { key: true, enabled: true, updatedAt: true },
    });

    await this.featureFlagsService.refreshCache();

    return updated;
  }
}
