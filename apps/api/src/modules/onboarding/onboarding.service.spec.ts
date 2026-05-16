import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OnboardingService } from './onboarding.service.js';

const mockPrisma = {
  category: {
    count: jest.fn(),
  },
  user: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(OnboardingService);
    jest.clearAllMocks();
  });

  describe('complete', () => {
    it('completes onboarding with exactly 1 category (minimum)', async () => {
      mockPrisma.category.count.mockResolvedValue(1);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.complete('user-uuid');

      expect(mockPrisma.category.count).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { onboardingCompleted: true },
      });
      expect(result).toEqual({
        message: 'Onboarding completed.',
        onboardingCompleted: true,
      });
    });

    it('completes onboarding when the user has multiple categories', async () => {
      mockPrisma.category.count.mockResolvedValue(3);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.complete('user-uuid');

      expect(result.onboardingCompleted).toBe(true);
    });

    it('throws BadRequestException with the correct message when no categories exist', async () => {
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: false,
      });

      await expect(service.complete('user-uuid')).rejects.toThrow(
        'You need at least 1 category to complete onboarding',
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when onboarding is already completed', async () => {
      mockPrisma.category.count.mockResolvedValue(1);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: true,
      });

      await expect(service.complete('user-uuid')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
