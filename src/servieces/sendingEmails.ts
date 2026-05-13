import { Hono,Context } from "hono"; // 1. Import Context
import { Resend } from 'resend';

type emailData = {
  to: string;
  subject: string;
  html: string;
}
type Bindings = {
  RESEND_API_KEY: string;
  D1_DATABASE: D1Database; // If you're also using your 'canzo' DB
}
async function sendEmail(c: Context<{ Bindings: Bindings }>, emailData: emailData) {
  const resend = new Resend(c.env.RESEND_API_KEY);
  
  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html
  });
}
export default sendEmail;
