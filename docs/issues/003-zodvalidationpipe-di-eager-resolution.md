# Issue 003 — ZodValidationPipe broke all e2e tests after adding APP_GUARD

**Date:** 2026-05-14  
**Context:** Adding `ThrottlerGuard` as a global `APP_GUARD` in `AppModule` during Step 17

---

## What happened

All four e2e test suites started failing after registering `ThrottlerGuard` as a global guard in `AppModule`. Every suite produced the same error on app bootstrap:

```
Nest can't resolve dependencies of the ZodValidationPipe (?).
Please make sure that the argument at index [0] is available in the current module.
```

The unit tests (`npm test`) continued to pass. Only the e2e tests broke. No changes had been made to `ZodValidationPipe` itself.

---

## Background: how NestJS dependency injection works

NestJS uses a **dependency injection (DI) container** to create and wire the objects your application needs. When you mark a class with `@Injectable()` and register it as a provider in a module, NestJS takes responsibility for constructing it. To do that, it reads the constructor parameters and looks for matching providers in the container.

```ts
// NestJS sees this and asks: what is AuthService's first constructor argument?
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //          NestJS looks for a PrismaService provider and injects it
}
```

This works because `PrismaService` is registered as a provider somewhere in the module tree and NestJS can find it.

**The metadata that makes this possible** is emitted by TypeScript at compile time when `emitDecoratorMetadata: true` is set in `tsconfig.json`. For each decorated class, TypeScript emits the constructor parameter types as runtime metadata (`design:paramtypes`). NestJS reads this metadata at startup to know what to inject.

```ts
// What TypeScript emits at runtime (conceptually):
Reflect.defineMetadata('design:paramtypes', [PrismaService], AuthService);
//                                           ^^^^^^^^^^^^^
//                                           NestJS reads this to know what to inject
```

---

## Background: lazy vs eager provider resolution

NestJS resolves providers **lazily by default** — it only constructs a provider when something actually requests it from the DI container. If a class is registered as a provider but nothing ever injects it, NestJS may never attempt to construct it and the missing dependency goes unnoticed at startup.

This is the normal behaviour for most NestJS applications, and it is why the bug described in this issue was hidden for so long.

---

## Background: what APP_GUARD does

NestJS has a concept of **global guards** — guards that apply to every route in the application without needing to be listed on each controller. There are two ways to register one:

```ts
// Option A: via app.useGlobalGuards() in main.ts or app.setup.ts
// This registers the guard outside the DI container — NestJS doesn't manage its dependencies
app.useGlobalGuards(new ThrottlerGuard(...));

// Option B: via APP_GUARD token in a module provider
// This registers the guard INSIDE the DI container — NestJS manages its dependencies
@Module({
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

Option B is required for guards that have their own injectable dependencies (like `ThrottlerGuard`, which depends on `ThrottlerStorage` and `Reflector`). When NestJS sees `APP_GUARD`, it **eagerly resolves the entire module graph** to wire the guard before the first request arrives.

This eager resolution is the key change that exposed the hidden bug.

---

## The hidden bug: ZodValidationPipe registered as a DI provider it could never fulfil

`ZodValidationPipe` was registered as a provider in `CommonModule`:

```ts
// common.module.ts (before the fix)
@Module({
  providers: [ZodValidationPipe, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [ZodValidationPipe, JwtAuthGuard, RolesGuard, JwtModule],
})
export class CommonModule {}
```

Its implementation looks like this:

```ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}
  //                                   ^^^^^^^^^
  //                                   NestJS cannot provide this
  transform(value: unknown) { ... }
}
```

The constructor takes a `ZodSchema` — but `ZodSchema` is a **TypeScript interface**, not a class. Interfaces are erased completely at compile time and have no runtime representation. NestJS cannot find a `ZodSchema` provider in its container because no such token exists at runtime.

Why did this not break before? Because `ZodValidationPipe` was **never actually used through DI**. Every controller instantiated it directly:

```ts
// auth.controller.ts
@Post('register')
async register(
  @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //         Direct instantiation — DI container never involved
): Promise<{ message: string }> {
  return this.authService.register(dto);
}
```

Because nothing ever asked NestJS to inject `ZodValidationPipe`, NestJS never tried to construct it and the missing `ZodSchema` dependency was never discovered.

---

## Why APP_GUARD triggered the failure

When `ThrottlerGuard` was added as `APP_GUARD`, NestJS changed from lazy to eager resolution of the full module graph. During this eager pass, it encountered `ZodValidationPipe` registered as a provider in `CommonModule` and attempted to construct it — for the first time ever. It read the constructor metadata, saw that `ZodSchema` was required at index 0, searched the DI container, found nothing, and threw:

```
Nest can't resolve dependencies of the ZodValidationPipe (?).
Please make sure that the argument at index [0] is available in the current module.
```

The `?` in the error is NestJS saying it couldn't determine the name of the missing dependency — because `ZodSchema` is an interface, its runtime value is `undefined`, and `undefined` has no useful name to display.

---

## Why unit tests still passed

Unit tests use `Test.createTestingModule()` with manually provided mocks. They never boot the full `AppModule` or `CommonModule` — each test module is assembled from scratch with only the providers it declares. `ZodValidationPipe` was never listed as a provider in any unit test module, so DI never tried to resolve it in that context.

---

## Fix

Remove `ZodValidationPipe` from `CommonModule` providers and exports entirely. Since it is always instantiated with `new`, it does not belong in the DI container. Controllers import the class directly from its file and use it manually — the module registration was never providing value:

```ts
// common.module.ts (after the fix)
@Module({
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard],
  //          ZodValidationPipe removed — never used via DI
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
  //        ZodValidationPipe removed
})
export class CommonModule {}
```

Controllers remain unchanged because they import the class directly, not from DI:

```ts
// Still works — direct import of the class, not DI injection
import { ZodValidationPipe } from '../../common/pipes/index.js';

@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto
```

---

## The rule this reveals

**Only register a class as a DI provider if NestJS is actually responsible for constructing it.** If you always instantiate a class yourself with `new`, it must not be in `providers`. Registering it there tells NestJS "please manage this object's lifecycle and inject its dependencies" — a promise that will eventually be called upon.

This distinction matters particularly for classes that take non-injectable constructor arguments (schemas, configuration objects, literals). These can never be satisfied by DI and will always fail if NestJS tries to resolve them.

---

## How to avoid next time

Before registering a class in `providers`, ask: **will NestJS ever need to construct this?**

- If it is always used as `new MyClass(someArg)` → do not put it in `providers`
- If it is injected into other classes via constructor → it must be in `providers`
- If it has constructor parameters that are interfaces or plain values → it cannot be a DI provider at all

When in doubt, search the codebase for usages. If every usage is `new MyClass(...)`, the `providers` registration is wrong.
