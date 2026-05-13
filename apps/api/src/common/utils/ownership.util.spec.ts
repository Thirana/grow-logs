import { NotFoundException } from '@nestjs/common';
import { assertOwnership } from './ownership.util.js';

describe('assertOwnership', () => {
  it('does not throw when IDs match', () => {
    expect(() => assertOwnership('user-1', 'user-1', 'Entry')).not.toThrow();
  });

  it('throws NotFoundException when IDs differ', () => {
    expect(() => assertOwnership('user-1', 'user-2', 'Entry')).toThrow(
      NotFoundException,
    );
  });

  it('includes the resource name in the error message', () => {
    expect(() => assertOwnership('a', 'b', 'Category')).toThrow(
      'Category not found',
    );
  });
});
