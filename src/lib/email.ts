import { Resend } from 'resend';
import { env } from './env';

const resendApiKey = process.env.RESEND_API_KEY || env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendOtpEmailParams {
  to: string;
  code: string;
  purpose: 'verify_email' | 'reset_password';
}

/**
 * Send OTP email via Resend or log to console in stub mode
 */
export async function sendOtpEmail({
  to,
  code,
  purpose,
}: SendOtpEmailParams): Promise<{ success: boolean; error?: string }> {
  const isVerification = purpose === 'verify_email';
  const subject = isVerification
    ? 'Verify your WeaveIt account'
    : 'Reset your WeaveIt password';

  const actionText = isVerification
    ? 'enter this verification code to confirm your email address'
    : 'use this code to reset your password';

  // If Resend API key is not configured, run in stub mode with console output
  if (!resend || !resendApiKey || resendApiKey.startsWith('mock') || resendApiKey.startsWith('re_sample')) {
    console.log('\n======================================================');
    console.log(`[STUB EMAIL SERVICE - DEVELOPMENT MODE]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Code: [ ${code} ]`);
    console.log(`Expires in: 10 minutes`);
    console.log('======================================================\n');
    return { success: true };
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f5; margin: 0; padding: 40px 20px; color: #1c1c1a; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e0; border-radius: 8px; padding: 36px 32px; }
          .logo { font-size: 20px; font-weight: 700; color: #005a9e; margin-bottom: 24px; }
          h1 { font-size: 22px; font-weight: 600; margin: 0 0 16px; color: #1c1c1a; }
          p { font-size: 15px; line-height: 1.5; color: #5c5c58; margin: 0 0 20px; }
          .code-box { background: #f0f4f9; border-radius: 6px; padding: 18px; text-align: center; margin: 28px 0; }
          .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #005a9e; }
          .expiry { font-size: 13px; color: #8c8c85; margin-top: 10px; }
          .footer { font-size: 12px; color: #8c8c85; text-align: center; margin-top: 28px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">WeaveIt</div>
          <h1>${subject}</h1>
          <p>Please ${actionText}:</p>
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expiry">This code will expire in 10 minutes.</div>
          </div>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} WeaveIt &bull; Scene-Driven Story Planning
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'WeaveIt <noreply@weaveit.app>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('[Resend Exception]', message);
    return { success: false, error: message };
  }
}
