import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(testSchema);
  });

  describe('transform', () => {
    it('returns parsed data when input is valid', () => {
      const input = { name: 'Alice', age: 30 };
      expect(pipe.transform(input)).toEqual({ name: 'Alice', age: 30 });
    });

    it('throws BadRequestException when input is invalid', () => {
      expect(() => pipe.transform({ name: '', age: 30 })).toThrow(
        BadRequestException,
      );
    });

    it('includes field-level error messages in the exception', () => {
      try {
        pipe.transform({ name: '', age: 30 });
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response['message']).toBe('Validation failed');
        expect(response['errorCode']).toBe('VALIDATION_ERROR');
        expect(Array.isArray(response['errors'])).toBe(true);
        expect((response['errors'] as string[]).length).toBeGreaterThan(0);
      }
    });

    it('reports the correct field path in error messages', () => {
      try {
        pipe.transform({ name: 'Alice', age: -1 });
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        const errors = response['errors'] as string[];
        expect(errors.some((e) => e.startsWith('age:'))).toBe(true);
      }
    });

    it('throws BadRequestException when required fields are missing', () => {
      expect(() => pipe.transform({})).toThrow(BadRequestException);
    });

    it('throws BadRequestException for non-object input', () => {
      expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
    });

    it('strips extra fields via Zod default (passthrough is not configured)', () => {
      const result = pipe.transform({ name: 'Alice', age: 25, extra: 'field' });
      expect(result).toEqual({ name: 'Alice', age: 25 });
    });
  });
});
