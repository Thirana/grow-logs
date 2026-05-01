# Step 13 — CommonModule: Roles Guard, CurrentUser Decorator, Ownership Utility

**Phase:** Phase 3 — CommonModule (Shared Infrastructure)
**Depends on:** Step 12 (JwtAuthGuard and AuthenticatedUser type must exist)

---

## What

Complete the `CommonModule` with three remaining utilities: the `RolesGuard` for admin-only routes, the `@CurrentUser()` decorator for extracting the authenticated user cleanly in controllers, and an ownership verification utility used in services to confirm a resource belongs to the requesting user.

---

## Why

These three pieces are used together on almost every protected route:
- `@CurrentUser()` extracts who is making the request
- `RolesGuard` checks if they have permission
- The ownership utility confirms the resource they're accessing belongs to them

Completing all three in one step means `CommonModule` is fully self-contained and ready to be imported by every business module.

---

## Deliverables

**`apps/api/src/common/guards/roles.guard.ts`**

Reads a `@Roles(UserRole.ADMIN)` metadata decorator and rejects requests from users without the required role with a 403:
```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return required.includes(user.role);
  }
}
```

**`apps/api/src/common/decorators/roles.decorator.ts`**
```ts
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

**`apps/api/src/common/decorators/current-user.decorator.ts`**
```ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    return ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;
  },
);
```

Usage in a controller:
```ts
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: AuthenticatedUser) {
  return this.usersService.findById(user.userId);
}
```

**`apps/api/src/common/utils/ownership.util.ts`**

A reusable function used in every service that retrieves a user-owned resource:
```ts
export function assertOwnership(
  resourceUserId: string,
  requestingUserId: string,
  resourceName: string,
): void {
  if (resourceUserId !== requestingUserId) {
    throw new NotFoundException(`${resourceName} not found`);
  }
}
```

Throws `NotFoundException` (not `ForbiddenException`) intentionally — revealing that a resource exists but is owned by someone else leaks information. Returning 404 treats unauthorised access and non-existence identically from the client's perspective.

**`CommonModule` update:** Export `RolesGuard`, `CurrentUser`, `Roles`, and `assertOwnership`.

---

## Key Decisions

**404 instead of 403 for ownership failures:** Returning 403 tells the attacker "this resource exists, you just can't access it." Returning 404 reveals nothing about whether the resource exists. This is the standard security pattern for user-scoped APIs.

**`getAllAndOverride` for metadata:** This reads metadata from the handler first, then the class. This means a method-level `@Roles` overrides a class-level one, which is the expected behaviour.

**`RolesGuard` is not global:** `RolesGuard` only does something when `@Roles(...)` is present. Routes without `@Roles` pass through regardless of the user's role. It should be applied explicitly on admin routes, not globally.

---

## Done When

- A route decorated with `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)` returns 403 for a USER-role token
- The same route returns 200 for an ADMIN-role token
- `@CurrentUser()` in a controller returns the correct `{ userId, role }` for the authenticated user
- `assertOwnership` throws `NotFoundException` when user IDs do not match
- `npm run typecheck` passes
