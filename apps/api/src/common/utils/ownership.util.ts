import { NotFoundException } from '@nestjs/common';

/**
 * Verifies that a resource's userId matches the requesting user's
 * JWT userId claim. Throws NotFoundException (404) rather than
 * ForbiddenException (403) to avoid leaking whether the resource exists.
 *
 * Called in every service method that fetches a user-owned resource
 * before returning it to the caller.
 */
export function assertOwnership(
  resourceUserId: string,
  requestingUserId: string,
  resourceName: string,
): void {
  if (resourceUserId !== requestingUserId) {
    throw new NotFoundException(`${resourceName} not found`);
  }
}
