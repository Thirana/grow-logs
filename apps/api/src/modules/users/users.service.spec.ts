import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UsersService, USER_SELECT } from './users.service.js';

const mockUser = {
  id: 'user-uuid',
  email: 'user@example.com',
  role: 'USER',
  isEmailVerified: true,
  onboardingCompleted: false,
  subscriptionStatus: 'FREE',
  subscriptionPlan: null,
  createdAt: new Date('2026-01-01'),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns the user profile when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-uuid');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        select: USER_SELECT,
      });
      expect(result).toEqual(mockUser);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEmail', () => {
    it('updates and returns the profile when email is not taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
      });

      const result = await service.updateEmail('user-uuid', {
        email: 'new@example.com',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { email: 'new@example.com' },
        select: USER_SELECT,
      });
      expect(result.email).toBe('new@example.com');
    });

    it('allows updating to the same email the user already has', async () => {
      // findUnique returns the same user — id matches, so no conflict
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-uuid' });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await expect(
        service.updateEmail('user-uuid', { email: 'user@example.com' }),
      ).resolves.not.toThrow();
    });

    it('throws ConflictException when email belongs to a different user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'other-user-uuid' });

      await expect(
        service.updateEmail('user-uuid', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
