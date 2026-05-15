import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export type OnboardingResult = {
  message: string;
  onboardingCompleted: boolean;
};

/**
 * Handles the single onboarding completion transition.
 * Used by: POST /api/v1/onboarding/complete
 */
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async complete(userId: string): Promise<OnboardingResult> {
    const [categoryCount, user] = await Promise.all([
      this.prisma.category.count({ where: { userId } }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { onboardingCompleted: true },
      }),
    ]);

    if (categoryCount < 3) {
      throw new BadRequestException(
        'You need at least 3 categories to complete onboarding',
      );
    }

    if (user.onboardingCompleted) {
      throw new ConflictException('Onboarding already completed');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    return { message: 'Onboarding completed.', onboardingCompleted: true };
  }
}
