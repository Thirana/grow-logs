# 10 — Static Security Analysis with ESLint

**Phase:** Phase 2 | **Concepts:** Static analysis, security linting, eslint-plugin-security, false positives

---

## What is Static Security Analysis?

Static analysis examines your source code *without running it* — looking for patterns that are known to introduce security vulnerabilities. It is different from:

- **Unit tests** — which verify logic at runtime
- **Dependency scanning** (Dependabot/Snyk) — which finds CVEs in packages you use
- **Penetration testing** — which attacks the running application

Static analysis catches mistakes during development, before code is ever executed. It answers: "does this code contain a pattern that has historically led to security incidents?"

---

## Why `eslint-plugin-security`

Node.js has specific security pitfalls that standard ESLint rules and TypeScript's type system do not catch:

| Vulnerability | Why TypeScript misses it | What the plugin catches |
|---|---|---|
| `eval()` with a variable | Typechecks fine — `eval` accepts `string` | `detect-eval-with-expression` |
| Unsafe RegExp (ReDoS) | A valid `RegExp` object is type-safe | `detect-unsafe-regex` |
| `child_process.exec` with unsanitised input | Returns typed output | `detect-child-process` |
| Unvalidated redirects | A string is a valid URL argument | `detect-possible-timing-attacks` |
| `require()` with a variable path | TypeScript allows dynamic requires | `detect-non-literal-require` |

These are all situations where the code is type-correct but dangerous at runtime when attacker-controlled input reaches it.

### Real-world impact

**ReDoS (Regular Expression Denial of Service):** A regex like `/(a+)+$/` on a long input can take exponential time to evaluate. An attacker sending `"aaaa...aaaaaX"` to an endpoint that validates with this regex can freeze your server thread. `detect-unsafe-regex` catches these patterns.

**eval injection:** If any part of a user-supplied string reaches `eval()`, the attacker can execute arbitrary code on your server. Even one-hop: `eval(someFunction(userInput))` is dangerous.

---

## How it Works in This Repo

The plugin is added to `apps/api/eslint.config.mjs` as a flat-config spread:

```js
import security from 'eslint-plugin-security';

export default tseslint.config(
  // ... existing config
  security.configs.recommended,  // adds all recommended security rules
  {
    rules: {
      // Disabled: flags all bracket-notation property access (obj[key])
      // regardless of whether the value is attacker-controlled. TypeScript's
      // type system already narrows what keys are valid, making this rule
      // produce near-100% false positives in typed codebases.
      'security/detect-object-injection': 'off',
    },
  },
);
```

It runs as part of the existing `npm run lint` step — zero overhead, no separate tool to invoke.

---

## The `detect-object-injection` False Positive Problem

`security/detect-object-injection` is designed to catch patterns like:

```js
// Dangerous: user controls which property is read
const value = config[req.body.key]; // attacker can read any config property
```

But in a TypeScript codebase, the rule also flags safe, typed patterns:

```ts
// Safe: key is typed as a specific union, not an arbitrary string
const errorCode = ERROR_MAP[statusCode]; // statusCode: 400 | 401 | 404 | 500
```

TypeScript's type system already prevents a user-controlled string from reaching these calls when the key is typed correctly. The rule has no visibility into TypeScript's type narrowing, so it flags everything. Disabling it is standard practice in TypeScript projects — the other 15 rules in the recommended config remain active.

---

## What the Remaining Rules Catch

With `detect-object-injection` disabled, the active rules still cover the highest-value checks:

| Rule | What it prevents |
|---|---|
| `detect-eval-with-expression` | `eval(variable)` — arbitrary code execution |
| `detect-unsafe-regex` | ReDoS via catastrophically backtracking regexes |
| `detect-child-process` | `exec(variable)` — command injection |
| `detect-non-literal-require` | `require(variable)` — dynamic module loading |
| `detect-non-literal-fs-filename` | `fs.readFile(variable)` — path traversal |
| `detect-possible-timing-attacks` | `===` comparison of secrets — timing side-channels |
| `detect-new-buffer` | Deprecated `new Buffer()` — potential memory disclosure |

These cover the OWASP Top 10 categories most likely to appear in a NestJS API: Injection (A03), Insecure Design (A04), and Security Misconfiguration (A05).

---

## Limitations

Static analysis finds patterns, not intent. It cannot tell if user input actually reaches the flagged call — that requires data-flow analysis (which tools like Semgrep or CodeQL do at higher cost). `eslint-plugin-security` is a fast, zero-config first layer, not a replacement for:

- Input validation at system boundaries (handled by Zod pipes)
- Dependency CVE scanning (handled by Dependabot)
- Runtime security headers (handled by Helmet)

---

## Interview Summary

**Q: What does `eslint-plugin-security` catch that TypeScript doesn't?**
TypeScript checks types, not security semantics. A function that accepts a `string` parameter is type-safe whether that string comes from a config file or an HTTP request body. `eslint-plugin-security` catches patterns where the code structure itself is dangerous — `eval` with a variable, unsanitised input in `exec`, ReDoS-vulnerable regexes — regardless of how the values are typed.

**Q: Why is `detect-object-injection` disabled?**
In TypeScript, bracket-notation property access like `obj[key]` is typed — the compiler knows what type `key` must be and prevents arbitrary strings from reaching it. The rule has no visibility into TypeScript's type narrowing, so it flags every typed bracket access as a potential injection sink. Disabling it removes near-100% false positives while the 15 other rules that catch actual exploitable patterns remain active.

**Q: Where does static security analysis fit relative to other security layers?**
It is the cheapest layer — runs in milliseconds on every lint invocation, catches mistakes before the PR is even opened. The other layers are: input validation (Zod, at system boundaries), secure HTTP headers (Helmet, at runtime), dependency scanning (Dependabot, on each push), and security review (before launch). Static analysis is the first gate, not the only one.
