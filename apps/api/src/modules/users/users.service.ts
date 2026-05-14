import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UpdateUserDto } from '@grow-logs/schemas';
import { PrismaService } from '../../prisma/prisma.service.js';

export const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  isEmailVerified: true,
  onboardingCompleted: true,
  subscriptionStatus: true,
  subscriptionPlan: true,
  createdAt: true,
} as const;

export type UserProfile = {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  createdAt: Date;
};

/**
 * Business logic for user profile reads and updates.
 * Never returns passwordHash or stripeCustomerId — USER_SELECT enforces this at the query level.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async updateEmail(userId: string, dto: UpdateUserDto): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('Email is already in use');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.email },
      select: USER_SELECT,
    });
  }
}
