import { Logger } from '@nestjs/common';
import { EmailService } from './email.service.js';

describe('EmailService', () => {
  let service: EmailService;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new EmailService();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('logs the verification URL with the token and email', () => {
      service.sendVerificationEmail('user@example.com', 'mock-token');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('mock-token'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
      );
    });

    it('includes the verify-email path in the log', () => {
      service.sendVerificationEmail('a@b.com', 'tok');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('/v1/auth/verify-email'),
      );
    });
  });
});
