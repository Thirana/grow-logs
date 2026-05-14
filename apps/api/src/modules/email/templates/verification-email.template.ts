export function verificationEmailHtml(verificationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5e7eb">
        <tr>
          <td style="padding-bottom:24px;border-bottom:1px solid #e5e7eb">
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#111827">Grow Logs</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 0 24px">
            <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#111827">Verify your email address</h2>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563">
              Thanks for signing up. Click the button below to verify your email address and activate your account.
              This link expires in <strong>24 hours</strong>.
            </p>
            <a href="${verificationUrl}"
               style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px">
              Verify email address
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:13px;color:#9ca3af">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color:#2563eb;word-break:break-all">${verificationUrl}</a>
            </p>
            <p style="margin:12px 0 0;font-size:13px;color:#9ca3af">
              If you did not create a Grow Logs account, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function verificationEmailText(verificationUrl: string): string {
  return `Verify your Grow Logs account\n\nClick the link below to verify your email address. This link expires in 24 hours.\n\n${verificationUrl}\n\nIf you did not create an account, you can ignore this email.`;
}
