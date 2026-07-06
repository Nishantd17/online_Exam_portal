import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, text }) => {
  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`Attempting to send email via Resend API to: ${to}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to,
          subject,
          html,
          text
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`Email successfully sent via Resend API. Resend ID: ${data.id}`);
        return true;
      } else {
        console.error('Resend API returned an error:', data);
      }
    } catch (resendError) {
      console.error('Error sending email via Resend API:', resendError.message);
    }
  }

  // 2. Try SMTP (Nodemailer) if configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log(`Attempting to send email via SMTP to: ${to}`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"${process.env.SMTP_SENDER_NAME || 'ExamPortal'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text
      });

      console.log(`Email successfully sent via SMTP. Message ID: ${info.messageId}`);
      return true;
    } catch (smtpError) {
      console.error('Error sending email via SMTP:', smtpError.message);
    }
  }

  // 3. Fallback mock logging for development if no service is configured
  console.log('==================================================');
  console.log(`[MAILER MOCK] Email would have been sent to: ${to}`);
  console.log(`[MAILER MOCK] Subject: ${subject}`);
  console.log(`[MAILER MOCK] Text content:\n${text}`);
  console.log('==================================================');

  return false;
};
