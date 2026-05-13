import { Resend } from 'resend';

type emailData = {
  to: string;
  subject: string;
  html: string;
}
async function sendEmail(apiKey:string,emailData: emailData) {
  const resend = new Resend(apiKey);
  
  return await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html
  });
}
export {sendEmail,type emailData};
