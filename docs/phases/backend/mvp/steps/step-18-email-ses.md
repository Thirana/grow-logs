# Step 18 — EmailModule: Resend Integration

**Phase:** Phase 5 — EmailModule (Resend)
**Depends on:** Step 14 (stub EmailModule must exist and be wired into AuthModule)

---

## What

Replace the dev-mode `EmailService` stub (which logs to console) with a real implementation that sends transactional email via Resend. The interface (`sendVerificationEmail`) does not change — only the implementation behind it.

---

## Why

A real SaaS needs to send real emails. The stub gets development done without credentials, but before users can sign up on a real environment, email delivery must work. This step is isolated from all auth logic — the only change is inside `EmailService`.

Resend was chosen over AWS SES because it has a simpler setup (single API key, no sandbox escape process, no IAM config), a free tier of 3,000 emails/month that covers the full MVP phase, and cleaner SDK ergonomics. The `EmailModule` boundary means switching to SES later requires changing only this service and one env var.

---

## Deliverables

**Install:**
```bash
npm install resend
```

**`EmailService` implementation (replaces stub):**
```ts
async sendVerificationEmail(email: string, token: string): Promise<void> {
  if (this.config.nodeEnv !== 'production') {
    this.logger.log(`[DEV] Verify: ${this.config.appUrl}/verify-email?token=${token}`);
    return;
  }

  const verificationUrl = `${this.config.appUrl}/verify-email?token=${token}`;
  await this.resend.emails.send({
    from: this.config.resendFromAddress,
    to: email,
    subject: 'Verify your Grow Logs account',
    html: this.buildVerificationEmailHtml(verificationUrl),
    text: `Verify your email: ${verificationUrl}`,
  });
}
```

**Email template (`buildVerificationEmailHtml`):**
Simple, inline-styled HTML — no template engine needed at MVP. Include:
- The product name
- A clear call-to-action button/link
- Plain text fallback (always include for email clients that block HTML)
- Link expiry notice (24 hours)

**`apps/api/src/config/env.validation.ts` update:**
```
RESEND_API_KEY       — required in production (API key from resend.com dashboard)
RESEND_FROM_ADDRESS  — required in production (must be a verified sender domain in Resend)
APP_URL              — required (used to construct the verification link)
```

Make these conditionally required: required when `NODE_ENV === 'production'`, optional otherwise.

**`apps/api/.env.example` update:**
```dotenv
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_ADDRESS=noreply@grow-logs.com
APP_URL=http://localhost:3000
```

---

## Key Decisions

**Conditional send based on `NODE_ENV`:** Even with real Resend credentials in staging or development, real emails should not fire during local development. The environment-based guard is the safest default.

**No template engine (inline HTML) for MVP:** Handlebars, MJML, and similar template engines add dependencies and complexity. At MVP with one email template, inline HTML is simpler and easier to maintain. Add a template engine when there are three or more distinct email templates.

**Always include plain text body:** Many corporate email clients block HTML. A `text` fallback ensures the verification link is always accessible.

**Sender domain verification:** Resend requires the sending domain (`grow-logs.com`) to be verified via DNS records. The `from` address must use a verified domain. Set this up in the Resend dashboard before deploying to production.

---

## Done When

- In `production` mode with a valid `RESEND_API_KEY`, `POST /v1/auth/register` results in a real verification email delivered to the recipient
- In `development` mode, the same endpoint logs the verification URL to console as before
- `npm run typecheck` passes
- `RESEND_API_KEY` and `RESEND_FROM_ADDRESS` missing in production causes startup to fail with a clear error
