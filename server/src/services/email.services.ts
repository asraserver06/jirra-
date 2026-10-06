import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to,
      subject,
      text: text || '',
      html,
    });
    console.log(`✉️ Email sent to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Example: Welcome Email template
export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #0f172a;">Welcome to TaskFlow, ${name}! 🚀</h2>
      <p style="color: #475569;">Your account has been created successfully. You can now collaborate on project boards, create tickets, and manage sprints.</p>
      <a href="http://localhost:3000/board" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Project Board</a>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Welcome to TaskFlow!', html });
};

// Example: Ticket Assignment Notification
export const sendTicketAssignedEmail = async (
  email: string,
  assigneeName: string,
  ticketKey: string,
  ticketTitle: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #0f172a;">New Ticket Assigned: [${ticketKey}]</h2>
      <p style="color: #475569;">Hi ${assigneeName}, you have been assigned to <strong>${ticketTitle}</strong>.</p>
      <a href="http://localhost:3000/board" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Issue</a>
    </div>
  `;
  return sendEmail({ to: email, subject: `[${ticketKey}] New Task Assigned: ${ticketTitle}`, html });
};