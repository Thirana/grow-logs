import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingService } from './onboarding.service.js';

const mockOnboardingService = {
  complete: jest.fn(),
};

const mockUser = {
  userId: 'user-uuid',
  role: 'USER',
  subscriptionStatus: 'FREE',
};

describe('OnboardingController', () => {
  let controller: OnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        { provide: OnboardingService, useValue: mockOnboardingService },
      ],
    }).compile();

    controller = module.get(OnboardingController);
    jest.clearAllMocks();
  });

  describe('complete', () => {
    it('delegates to onboardingService.complete with the authenticated user ID', async () => {
      const serviceResult = {
        message: 'Onboarding completed.',
        onboardingCompleted: true,
      };
      mockOnboardingService.complete.mockResolvedValue(serviceResult);

      const result = await controller.complete(mockUser);

      expect(mockOnboardingService.complete).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual({ data: serviceResult, meta: {} });
    });
  });
});
