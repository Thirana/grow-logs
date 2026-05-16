import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsController } from './feature-flags.controller.js';
import { FeatureFlagsService } from './feature-flags.service.js';

const mockService = {
  getAll: jest.fn(),
};

describe('FeatureFlagsController', () => {
  let controller: FeatureFlagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagsController],
      providers: [{ provide: FeatureFlagsService, useValue: mockService }],
    }).compile();

    controller = module.get(FeatureFlagsController);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('delegates to service and wraps in data envelope', async () => {
      const flags = [
        { key: 'ai_weekly_summary', enabled: false },
        { key: 'stripe_billing', enabled: false },
      ];
      mockService.getAll.mockResolvedValue(flags);

      const result = await controller.getAll();

      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: flags, meta: {} });
    });

    it('returns empty array when no flags are seeded', async () => {
      mockService.getAll.mockResolvedValue([]);

      const result = await controller.getAll();

      expect(result).toEqual({ data: [], meta: {} });
    });
  });
});
