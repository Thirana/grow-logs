# Step 18 — EmailModule: AWS SES Integration

**Phase:** Phase 5 — EmailModule (AWS SES)
**Depends on:** Step 14 (stub EmailModule must exist and be wired into AuthModule)

---

## What

Replace the dev-mode `EmailService` stub (which logs to console) with a real implementation that sends transactional email via AWS Simple Email Service. The interface (`sendVerificationEmail`) does not change — only the implementation behind it.

---

## Why

A real SaaS needs to send real emails. The stub gets development done without AWS credentials, but before users can sign up on a real environment, email delivery must work. This step is isolated from all auth logic — the only change is inside `EmailService`.

AWS SES was chosen over alternatives (SendGrid, Resend, Postmark) because it integrates with the existing AWS infrastructure and has the lowest per-email cost at scale (~$0.10 per 1,000 emails).

---

## Deliverables

**Install:**
```bash
npm install @aws-sdk/client-ses
```

**`EmailService` implementation (replaces stub):**
```ts
async sendVerificationEmail(email: string, token: string): Promise<void> {
  if (this.config.nodeEnv !== 'production') {
    this.logger.log(`[DEV] Verify: ${this.config.appUrl}/verify-email?token=${token}`);
    return;
  }

  const verificationUrl = `${this.config.appUrl}/verify-email?token=${token}`;
  await this.sesClient.send(new SendEmailCommand({
    Source: this.config.sesFromAddress,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Verify your Grow Logs account' },
      Body: {
        Html: { Data: this.buildVerificationEmailHtml(verificationUrl) },
        Text: { Data: `Verify your email: ${verificationUrl}` },
      },
    },
  }));
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
AWS_REGION          — required in production
AWS_SES_FROM_ADDRESS — required in production (must be a verified SES sender)
APP_URL              — required (used to construct the verification link)
```

Make these conditionally required: required when `NODE_ENV === 'production'`, optional otherwise.

**`apps/api/.env.example` update:**
```dotenv
AWS_REGION=eu-west-1
AWS_SES_FROM_ADDRESS=noreply@grow-logs.com
APP_URL=http://localhost:3000
```

---

## Key Decisions

**Conditional send based on `NODE_ENV`:** Even with real AWS credentials in staging/development, you do not want to accidentally send real emails during local development. The environment-based guard is the safest default.

**No template engine (inline HTML) for MVP:** Handlebars, MJML, and similar template engines add dependencies and complexity. At MVP with one email template, inline HTML is simpler and easier to maintain. Add a template engine when there are three or more distinct email templates.

**Always include plain text body:** Many corporate email clients block HTML. A `Text` fallback ensures the verification link is always accessible.

**SES sandbox mode:** New AWS SES accounts are in sandbox mode and can only send to verified email addresses. Verify your test email address in the AWS SES console and document this requirement. Production requires requesting SES production access from AWS.

---

## Done When

- In `production` mode with valid AWS credentials, `POST /v1/auth/register` results in a real verification email delivered to a verified SES recipient address
- In `development` mode, the same endpoint logs the verification URL to console as before
- `npm run typecheck` passes
- `AWS_REGION` and `AWS_SES_FROM_ADDRESS` missing in production causes startup to fail with a clear error
