# Step 11 — CommonModule: Zod Validation Pipe

**Phase:** Phase 3 — CommonModule (Shared Infrastructure)
**Depends on:** Step 05 (Prisma schema), Step 02 (packages/schemas must exist)

---

## What

Build the `ZodValidationPipe` — a custom NestJS pipe that validates incoming request bodies using Zod schemas. Also define the base Zod schema building blocks in `packages/schemas` that all future module DTOs will import and extend.

---

## Why

NestJS's built-in `ValidationPipe` uses `class-validator` decorators. This project uses Zod as its single validation library across the full stack. A custom Zod pipe lets the backend use the same schemas from `packages/schemas` that the frontend uses for form validation — one definition, validated consistently everywhere.

Without this pipe, each module would need its own ad-hoc validation logic or would have to use class-validator, which introduces a second validation library.

---

## Deliverables

**`packages/schemas/src/common.ts`** — shared primitive schemas used across all modules:
```ts
export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
```

**`packages/schemas/src/index.ts`** — export everything from `common.ts` (and future schema files).

**`apps/api/src/common/pipes/zod-validation.pipe.ts`** — the pipe implementation:
```ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        errorCode: 'VALIDATION_ERROR',
      });
    }
    return result.data;
  }
}
```

Usage in a controller:
```ts
@Post()
create(@Body(new ZodValidationPipe(createEntrySchema)) dto: CreateEntryDto) {}
```

**`apps/api/src/common/pipes/index.ts`** — barrel export.

**`apps/api/src/common/common.module.ts`** — `CommonModule` class (exports pipes for use by other modules).

---

## Key Decisions

**Pipe per-route, not global:** The global `ValidationPipe` from the bootstrap handles basic input sanitisation (`whitelist: true`, `forbidNonWhitelisted: true`). The `ZodValidationPipe` is applied per-route with a specific schema. This gives explicit control over which schema validates which endpoint.

**Error format matches the API contract:** The pipe throws a `BadRequestException` with the same `{ message, errors, errorCode }` shape that the global `AppExceptionFilter` expects. This ensures Zod validation errors look identical to class-validator errors in the response.

**Zod's `safeParse` not `parse`:** Using `parse` throws a `ZodError` that the exception filter would catch as an unknown error and return a 500. Using `safeParse` lets the pipe produce a proper 400 with field-level messages.

---

## Done When

- `packages/schemas` builds and exports `uuidSchema`, `paginationSchema`, `dateStringSchema`
- `ZodValidationPipe` applied to a test endpoint rejects invalid input with a 400 and returns `errors[]` in the response
- Valid input passes through and is returned with the correct type
- `npm run typecheck` and `npm run lint` pass
