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
    it('sets onboardingCompleted to true and returns the success response', async () => {
      mockPrisma.category.count.mockResolvedValue(3);
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

    it('also completes when the user has more than 3 categories', async () => {
      mockPrisma.category.count.mockResolvedValue(5);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.complete('user-uuid');

      expect(result.onboardingCompleted).toBe(true);
    });

    it('throws BadRequestException when fewer than 3 categories exist', async () => {
      mockPrisma.category.count.mockResolvedValue(2);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: false,
      });

      await expect(service.complete('user-uuid')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException with the exact message when under the limit', async () => {
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        onboardingCompleted: false,
      });

      await expect(service.complete('user-uuid')).rejects.toThrow(
        'You need at least 3 categories to complete onboarding',
      );
    });

    it('throws ConflictException when onboarding is already completed', async () => {
      mockPrisma.category.count.mockResolvedValue(4);
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
