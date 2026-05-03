import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
};

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLiveness', () => {
    it('returns status ok and a numeric uptime', () => {
      const result = service.getLiveness();
      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('getReadiness', () => {
    it('returns status ok and db reachable when query succeeds', async () => {
      const result = await service.getReadiness();
      expect(result).toEqual({ status: 'ok', db: 'reachable' });
    });

    it('throws ServiceUnavailableException when the DB query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(
        new Error('Connection refused'),
      );
      await expect(service.getReadiness()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
