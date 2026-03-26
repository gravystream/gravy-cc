import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "Novaclio"}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0A0A0A;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;border:1px solid #2D2D2D;padding:40px;">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <h1 style="color:#D4A843;font-size:24px;margin:0;">Novaclio</h1>
                </td>
              </tr>
              <tr>
                <td style="color:#FFFFFF;font-size:16px;line-height:1.6;padding-bottom:16px;">
                  <p style="margin:0 0 16px 0;">Hi there,</p>
                  <p style="margin:0 0 16px 0;">We received a request to reset your password. Click the button below to choose a new password:</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:16px 0 24px 0;">
                  <a href="${resetUrl}" style="display:inline-block;background-color:#D4A843;color:#000000;font-weight:bold;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;">Reset Password</a>
                </td>
              </tr>
              <tr>
                <td style="color:#808080;font-size:14px;line-height:1.5;">
                  <p style="margin:0 0 8px 0;">This link will expire in 1 hour.</p>
                  <p style="margin:0 0 8px 0;">If you didn&apos;t request a password reset, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid #2D2D2D;padding-top:24px;margin-top:24px;color:#444444;font-size:12px;text-align:center;">
                  <p style="margin:0;">&copy; ${new Date().getFullYear()} Novaclio. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: "Reset Your Password - Novaclio",
    html,
  });
}
