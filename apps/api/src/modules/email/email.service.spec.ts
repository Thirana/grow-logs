import { Test, TestingModule } from '@nestjs/testing';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service.js';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn() },
  })),
}));

import { Resend } from 'resend';

const buildConfigService = (overrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => {
    const defaults: Record<string, unknown> = {
      NODE_ENV: 'development',
      APP_URL: 'http://localhost:3000',
      RESEND_FROM_ADDRESS: 'onboarding@resend.dev',
      RESEND_API_KEY: 're_test_key',
      ...overrides,
    };
    return defaults[key];
  }),
});

describe('EmailService', () => {
  let service: EmailService;
  let mockSend: jest.Mock;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const buildService = async (
    configOverrides: Record<string, unknown> = {},
  ) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: buildConfigService(configOverrides),
        },
      ],
    }).compile();
    return module.get(EmailService);
  };

  beforeEach(async () => {
    mockSend = jest.fn();
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send: mockSend },
    }));
    service = await buildService();
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendVerificationEmail — development mode', () => {
    it('logs the verification URL and does not call Resend', async () => {
      await service.sendVerificationEmail('user@example.com', 'test-token');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'http://localhost:3000/verify-email?token=test-token',
        ),
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('includes the recipient email in the log', async () => {
      await service.sendVerificationEmail('user@example.com', 'test-token');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
      );
    });
  });

  describe('sendVerificationEmail — production mode', () => {
    beforeEach(async () => {
      service = await buildService({ NODE_ENV: 'production' });
    });

    it('calls resend.emails.send with correct parameters', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

      await service.sendVerificationEmail('user@example.com', 'prod-token');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user@example.com'],
          subject: 'Verify your Grow Logs account',
        }),
      );
    });

    it('includes the verification URL in both html and text body', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

      await service.sendVerificationEmail('user@example.com', 'prod-token');

      const call = (mockSend.mock.calls as [Record<string, string>][])[0][0];
      expect(call.html).toContain(
        'http://localhost:3000/verify-email?token=prod-token',
      );
      expect(call.text).toContain(
        'http://localhost:3000/verify-email?token=prod-token',
      );
    });

    it('logs the error and throws InternalServerErrorException when Resend returns an error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      await expect(
        service.sendVerificationEmail('user@example.com', 'prod-token'),
      ).rejects.toThrow(InternalServerErrorException);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid API key'),
      );
    });

    it('does not log the dev URL in production mode', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });

      await service.sendVerificationEmail('user@example.com', 'prod-token');

      expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('[DEV]'));
    });
  });
});
