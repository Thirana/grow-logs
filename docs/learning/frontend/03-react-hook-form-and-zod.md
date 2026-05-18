# 03 — React Hook Form + Zod: Form Validation in Practice

**Phase:** F01–F05 | **Concepts:** controlled vs uncontrolled inputs, `useForm`, `zodResolver`, `register`, `handleSubmit`, `formState.errors`, cross-field validation with `.refine()`, `setError`, API-driven errors, loading states

---

## Why Plain React Forms Don't Scale

A form with `useState` seems straightforward at first:

```typescript
// The naive approach — one state variable per field
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [emailError, setEmailError] = useState('');
const [passwordError, setPasswordError] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);

function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setEmailError('');
  setPasswordError('');

  if (!email) setEmailError('Email is required');
  if (!password) setPasswordError('Password is required');
  if (!email || !password) return;

  setIsSubmitting(true);
  loginMutation.mutate({ email, password }, {
    onSuccess: () => { ... },
    onError: (error) => {
      setIsSubmitting(false);
      // ... parse the error and set field errors
    },
  });
}
```

This is already six state variables for a two-field form. Add a third field, cross-field validation, server-side field errors, show-errors-only-after-blur behaviour, and auto-focus on the first error — and you have a hundred lines of boilerplate that is almost identical in every form. The validation logic is duplicated between frontend and backend.

React Hook Form (RHF) solves the mechanics. Zod defines the rules. Together they reduce the login form to a schema definition and a few hook calls.

---

## Section 1: Controlled vs Uncontrolled — Why RHF Chose the DOM

React has two models for form inputs. Understanding which one RHF uses explains why it performs so much better than the naive approach.

### Controlled Inputs

In the controlled model, React state holds the current value. Every keystroke fires `onChange`, which calls `setState`, which triggers a re-render of the form:

```typescript
// Controlled — a re-render happens on every keystroke
const [email, setEmail] = useState('');

<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

This is fine for a single input. For a form with ten fields, every character the user types in any field re-renders the entire form component tree. The re-renders are usually cheap enough that users don't notice, but they are wasted work.

### Uncontrolled Inputs

In the uncontrolled model, the DOM holds the value. React reads it only when needed — on blur (to validate) or on submit (to collect values):

```typescript
// Uncontrolled — React reads from the DOM, not state
const emailRef = useRef<HTMLInputElement>(null);
// on submit: emailRef.current?.value
```

React Hook Form uses the **uncontrolled model** internally. `register('email')` attaches a `ref` to the input. RHF reads the value from the DOM on blur and on submit — not on every keystroke. There are no re-renders during typing.

```typescript
// register returns { name, ref, onChange, onBlur }
// ref is how RHF reads the DOM value without putting it in state
<input {...register('email')} type="email" />
```

The practical effect: a large form with `useForm` + `register` triggers far fewer renders than the same form with individual `useState` calls. Validation errors appear correctly without any state for errors — RHF tracks them internally.

---

## Section 2: Zod — The Schema as the Single Source of Truth

### Why Validation Must Be Defined Once

In this project, the same validation rules apply in two places: the **frontend form** (shown to the user before submission) and the **backend API** (enforced on the server regardless of what the frontend sent). If these rules are defined separately, they drift out of sync. The backend might require a minimum password length of 8 characters while the frontend allows 6 — users are rejected by the API after passing the form validation, creating a confusing experience.

The solution is to define every validation rule once in `packages/schemas` and import it in both places:

```
packages/schemas/src/auth.ts
    ↓ imported as zodResolver         ↓ imported as ZodPipe
LoginForm (frontend)            AuthController (backend NestJS)
```

### The Schema Structure

Zod schemas are composed by chaining validation methods. Each method adds a rule, and the string argument is the user-facing error message:

```typescript
// packages/schemas/src/auth.ts
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});
```

Zod validates rules in chain order and stops at the first failure. If `min(8)` fails, the two `regex` checks are skipped — the user sees one error at a time, not all three at once.

### Deriving the TypeScript Type

`z.infer` derives the TypeScript type from the schema. You never write a separate `interface LoginDto` — the schema is the source of truth for both runtime validation and compile-time types:

```typescript
type FormValues = z.infer<typeof loginSchema>;
// equivalent to: { email: string; password: string }
```

If a field is renamed in the schema, the type changes automatically. TypeScript propagates the change to every usage.

---

## Section 3: `zodResolver` — Bridging RHF and Zod

`@hookform/resolvers/zod` provides the bridge between RHF and Zod. Pass it to `useForm` once:

```typescript
// Wrong — defining validation inside useForm using RHF's built-in rules
const { register } = useForm<FormValues>({
  defaultValues: { email: '', password: '' },
  // Built-in RHF validation: rules are co-located with the input, not the schema
  // They cannot be shared with the backend
});

// Correct — Zod schema drives all validation
const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(loginSchema),
});
```

When `handleSubmit` fires, RHF calls the `zodResolver` instead of its own built-in validation. The resolver runs the form values through `loginSchema.safeParse()`. If any field fails, it maps Zod's structured errors into RHF's `errors` object, field by field. If all fields pass, the resolver returns the validated, typed values and `handleSubmit` calls your submit function.

The entire validation pipeline — rules, error messages, field mapping — comes from the Zod schema. RHF handles when to validate (on blur, on submit, on change after first error) and where to display errors.

---

## Section 4: Registering Inputs

`register('fieldName')` returns a set of props that RHF needs to attach to a native input. Spread them onto the input element:

```typescript
// What register returns:
// { name: 'email', ref: ..., onChange: ..., onBlur: ... }

<input
  {...register('email')}
  id="email"
  type="email"
  autoComplete="email"
  placeholder="you@example.com"
  className={inputCls(!!errors.email)}
  aria-invalid={!!errors.email}
/>
```

- `name` — identifies the field in the form's value object
- `ref` — lets RHF read the DOM value on submit without React state
- `onChange` — clears validation errors as the user types (after first submission attempt)
- `onBlur` — triggers validation when the user leaves the field

`aria-invalid` is set to `true` when there's a validation error, which assistive technologies use to announce the field as invalid. It also works as a CSS selector: `[aria-invalid=true]` can style the border red without needing a separate error class.

### The Naming Conflict in `register-form.tsx`

RHF's hook function is named `register`. The `useRegister` mutation hook is also named `register` by convention. Both are used in the same component:

```typescript
// Wrong — the mutation overwrites RHF's register
const register = useRegister();
const { register } = useForm<FormValues>(...); // syntax error: duplicate binding

// Correct — alias RHF's register to avoid the collision
const register = useRegister();                   // the API mutation hook
const { register: field, handleSubmit, ... } = useForm<FormValues>(...); // RHF's register

// Usage with alias:
<input {...field('email')} />   // field, not register
```

---

## Section 5: `handleSubmit` — The Validation Gate

`handleSubmit(yourFunction)` is the bridge between the HTML form's submit event and your application logic. It intercepts the submission, runs the resolver, and either populates errors (stopping submission) or calls your function with typed values:

```typescript
function onSubmit(values: FormValues): void {
  // Only called if the Zod schema passes
  // values is FormValues — typed and validated, no casts needed
  loginMutation.mutate(values, {
    onSuccess: ({ data }) => {
      saveSession(data.user, data.accessToken);
      void router.replace('/dashboard');
    },
    onError: (error) => { ... },
  });
}

return (
  <form onSubmit={handleSubmit(onSubmit)} noValidate>
    ...
  </form>
);
```

`noValidate` on the form element disables the browser's built-in validation UI. Without it, the browser might show its own error popups that conflict with RHF's inline error messages, creating a confusing double-error experience.

The flow on submit:

```
User clicks "Log in"
    ↓
handleSubmit intercepts the submit event
    ↓
zodResolver runs loginSchema.safeParse(formValues)
    ↓
  If any field fails:
    errors object is updated → error messages appear under each field
    onSubmit is NOT called
  If all fields pass:
    onSubmit(validatedValues) is called
    ↓
  loginMutation.mutate(values)
```

---

## Section 6: Displaying Errors

### The `errors` Object

`formState.errors` is an object keyed by field name. When a field fails validation, `errors.fieldName` contains `{ message: string, type: string }`:

```typescript
// After a failed login form submission:
errors.email?.message   // undefined (no email error)
errors.password?.message // 'Password is required'
```

The optional chaining `?.message` handles the case where there's no error — the expression returns `undefined`, and the error UI does not render.

### The `Field` Wrapper Pattern

All auth forms use a `Field` wrapper component that binds the label, input, and error message together as a unit:

```typescript
interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-gl-text block text-[13px] font-medium">
        {label}
      </label>
      {children}                    {/* the input, rendered as children */}
      {error && (
        <p role="alert" className="text-gl-danger text-[12px] leading-snug">
          {error}
        </p>
      )}
    </div>
  );
}

// Usage in every form:
<Field id="email" label="Email address" error={errors.email?.message}>
  <input {...register('email')} id="email" />
</Field>
```

`role="alert"` on the error paragraph causes screen readers to announce the error message when it appears. `htmlFor={id}` on the label links it to the input so clicking the label focuses the field — required for accessibility.

### Error State in Input Styling

The input class is computed from the error state, giving the field a red border when invalid:

```typescript
const inputCls = (hasError: boolean) =>
  cn(
    'bg-gl-bg border-gl-border-input text-gl-text',
    'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none',
    'focus-visible:border-gl-primary focus-visible:ring-2 focus-visible:ring-gl-primary/15',
    hasError && 'border-gl-danger focus-visible:ring-gl-danger/20',
  );

// Passed to the input:
className={inputCls(!!errors.email)}
```

`!!errors.email` coerces the error object to a boolean — `true` when there's an error, `false` when the field is valid.

---

## Section 7: Cross-Field Validation with `.refine()`

### Why Standard Field Validation Is Not Enough

Zod's field-level validations (`z.string().min(8)`) operate on a single field in isolation. Some validation rules involve more than one field — the classic example being "confirm password must match password". Neither field can express this rule on its own.

`.refine()` adds a validator that receives the entire form object, enabling any cross-field logic:

```typescript
// components/auth/register-form.tsx

// Step 1: extend registerSchema to add the UI-only confirmPassword field
// (registerSchema lives in packages/schemas and is shared with the backend;
//  the backend has no confirmPassword concept, so it's not in the shared schema)
const formSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],   // attach the error to this specific field slot
    }
  );

type FormValues = z.infer<typeof formSchema>;
// { email: string; password: string; confirmPassword: string }
```

When the user submits and `password !== confirmPassword`:
- Zod calls the refine function with the full form object
- The function returns `false`
- Zod creates an error at the `path` you specified: `errors.confirmPassword.message = 'Passwords do not match'`
- The `Field` wrapper around the confirm password input renders the error message

Without the `path` option, Zod attaches the error to the root of the object (`errors.root`) with no field name — it would not appear under the confirm password input.

---

## Section 8: API-Driven Errors with `setError`

### When Zod Passes but the Server Rejects

Client-side validation catches format errors. But the server enforces business rules that client-side validation cannot: is this email already registered? Is the password correct for this account? These errors only exist after the API responds.

`setError` writes into the same `errors` object that Zod uses, making API errors appear inline under the correct field:

```typescript
// components/auth/register-form.tsx
const { register: field, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(formSchema),
});

onError: (error) => {
  if (error.response?.status === 409) {
    // 409 Conflict — this email is already registered
    setError('email', {
      message: 'An account with this email already exists.',
    });
    return;
  }
  // For other errors (network failure, 500), show a toast
  toast.error(getApiErrorMessage(error));
},
```

The 409 case puts the error message into `errors.email.message`. The `Field` wrapper renders it under the email input, exactly as if Zod had produced the error. The user sees inline feedback, not a disconnected alert banner.

### When the Error Doesn't Belong to a Field

The login form demonstrates the opposite case — a 401 where you deliberately cannot say which field is wrong:

```typescript
// components/auth/login-form.tsx
const [formError, setFormError] = useState<string | null>(null);

onError: (error) => {
  const status = error.response?.status;

  if (status === 401) {
    setFormError('Invalid email or password.');
    return;
  }
  toast.error(getApiErrorMessage(error));
},
```

A security principle: on login failure, never tell the user which field was wrong. "Invalid email" tells an attacker that the email is valid — they can use it for other attacks. "Invalid email or password" leaks nothing. So the error goes to `formError` state and renders as a highlighted banner above the submit button, not attached to either field.

---

## Section 9: Loading State

The mutation's `isPending` flag is `true` while the HTTP request is in flight. Wire it to the submit button to prevent double-submission and give the user feedback:

```typescript
<button
  type="submit"
  disabled={loginMutation.isPending}
  className={cn(
    'bg-gl-primary text-gl-primary-ink',
    'w-full rounded-lg py-2.5 text-[14px] font-semibold',
    'disabled:pointer-events-none disabled:opacity-50',
  )}
>
  {loginMutation.isPending ? (
    <>
      <Loader2 className="size-4 animate-spin" />
      Logging in…
    </>
  ) : (
    'Log in'
  )}
</button>
```

`disabled:pointer-events-none` prevents any click events from firing while the button is disabled. `disabled:opacity-50` visually dims it. `Loader2` from Lucide renders a circular spinner that rotates via Tailwind's `animate-spin` utility.

This pattern is identical across all three auth forms and the onboarding completion button.

---

## How the Form Stack Fits Together

```
packages/schemas/src/auth.ts
  registerSchema, loginSchema
      │
      │  z.infer derives the TypeScript type
      │  zodResolver bridges to RHF
      ▼
useForm<FormValues>({ resolver: zodResolver(schema) })
      │
      │  register() attaches ref + handlers to DOM inputs
      ▼
<input {...register('email')} />    ← uncontrolled — DOM holds value
      │
      │  handleSubmit runs resolver on submit
      ▼
  Zod validates
      │
  Fails → errors object updated → error messages render under fields
  Passes → onSubmit(validatedValues) called
      │
      ▼
mutation.mutate(values)
      │
  onSuccess → router.replace / router.push
  onError → setError (field-level) or toast (global)
```

Each layer is independently reusable:
- The schema can be imported by the backend without knowing RHF exists
- The mutation hook can be called outside a form (e.g. programmatic logout)
- The `Field` component works with any form library
- `handleSubmit` and `zodResolver` work with any Zod schema

The form component is only responsible for wiring them together.
