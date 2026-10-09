import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

const isTestEnv = ENV.NODE_ENV === 'test' || process.env.NODE_ENV === 'test';
const hasSmtp = Boolean(ENV.SMTP_USER && ENV.SMTP_PASS) && !isTestEnv;

export const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    })
  : null;

export const verifySmtp = async (): Promise<boolean> => {
  if (!transporter) {
    if (isTestEnv) {
      console.log('ℹ️ [SMTP Status] Transporter skipped (test environment)');
      return false;
    }
    console.warn('⚠️ [SMTP Status] Transporter not initialized. Missing SMTP_USER or SMTP_PASS.');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ [SMTP ready] Connection to Gmail SMTP server verified successfully');
    return true;
  } catch (error: any) {
    console.error('❌ [SMTP verify error]:', {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      command: error?.command,
    });
    return false;
  }
};


// ==========================================
// 1. INVITATION EMAIL TEMPLATE
// ==========================================
const inviteEmailHtml = (
  workspaceName: string,
  inviterName: string,
  role: string,
  inviteUrl: string
) => {
  const roleLabel = role === 'admin' ? 'Admin' : 'Team Member';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to ${workspaceName}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
            <!-- Header with TaskFlow Branding -->
            <tr>
              <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f1f5f9;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #0f172a; color: #ffffff; width: 36px; height: 36px; border-radius: 10px; text-align: center; font-weight: 800; font-size: 18px; line-height: 36px;">
                      T
                    </td>
                    <td style="padding-left: 12px; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      TaskFlow
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <div style="display: inline-block; padding: 4px 10px; background-color: #f1f5f9; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 16px;">
                  Workspace Invitation
                </div>

                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                  Join ${workspaceName} on TaskFlow
                </h1>

                <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace as a <strong>${roleLabel}</strong>.
                </p>

                <!-- Call to Action Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                  <tr>
                    <td align="left" style="border-radius: 10px; background-color: #7c3aed;">
                      <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">
                        Accept Invitation
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Expiry Note -->
                <div style="background-color: #f8fafc; border-left: 3px solid #7c3aed; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                    ⏳ <strong>Important:</strong> This invitation link is valid for <strong>7 days</strong>.
                  </p>
                </div>

                <!-- Fallback link -->
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  If the button above doesn't work, copy and paste this link into your browser:<br>
                  <a href="${inviteUrl}" style="color: #7c3aed; word-break: break-all; text-decoration: underline;">${inviteUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  If you were not expecting this invitation, you can safely ignore this email.<br>
                  © ${new Date().getFullYear()} TaskFlow Inc. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export const sendWorkspaceInviteEmail = async (
  email: string,
  inviterName: string,
  workspaceName: string,
  token: string,
  role: string = 'member'
) => {
  const inviteUrl = `${ENV.CLIENT_URL}/invite/accept?token=${encodeURIComponent(token)}`;
  const roleLabel = role === 'admin' ? 'Admin' : 'Team Member';
  const html = inviteEmailHtml(workspaceName, inviterName, role, inviteUrl);
  const text = `${inviterName} invited you to join ${workspaceName} on TaskFlow as a ${roleLabel}.\n\nAccept your invitation: ${inviteUrl}\n\nNote: This link expires in 7 days.\nIf you were not expecting this invitation, you can safely ignore this email.`;

  if (!transporter) {
    if (isTestEnv) {
      console.log(`✉️ [Test Mode] SMTP skipped. Invite for ${email} (${roleLabel}): ${inviteUrl}`);
      return { success: true, testMode: true, inviteUrl };
    }
    console.warn(`⚠️ [SMTP not configured] Cannot send invite email to ${email}. Invite link: ${inviteUrl}`);
    throw new Error(`SMTP not configured. Invite URL: ${inviteUrl}`);
  }

  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to: email,
      subject: `${inviterName} invited you to join ${workspaceName} on TaskFlow`,
      text,
      html,
    });
    console.log(`✉️ Invite email delivered to ${email}:`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  } catch (error: any) {
    console.error('❌ [sendWorkspaceInviteEmail] Error sending invite email:', {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      command: error?.command,
      recipient: email,
    });
    console.log(`✉️ Fallback invite URL for ${email}: ${inviteUrl}`);
    throw error;
  }
};

// ==========================================
// 2. ADMIN WELCOME EMAIL TEMPLATE
// ==========================================
const welcomeEmailHtml = (
  adminName: string,
  workspaceName: string,
  workspaceUrl: string
) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TaskFlow</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);">
            <!-- Header with TaskFlow Branding -->
            <tr>
              <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f1f5f9;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #0f172a; color: #ffffff; width: 36px; height: 36px; border-radius: 10px; text-align: center; font-weight: 800; font-size: 18px; line-height: 36px;">
                      T
                    </td>
                    <td style="padding-left: 12px; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      TaskFlow
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                  Welcome to TaskFlow, ${adminName}!
                </h1>

                <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Your admin account is ready, and your workspace <strong>${workspaceName}</strong> has been created. You have full owner permissions to configure workflows, track sprint velocity, and invite team members.
                </p>

                <!-- Call to Action Button -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                  <tr>
                    <td align="left" style="border-radius: 10px; background-color: #0f172a;">
                      <a href="${workspaceUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">
                        Go to Workspace
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Getting Started Checklist -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
                    🚀 Quick Getting-Started Guide:
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.7;">
                    <li><strong>Set up your board:</strong> Create tasks, assign priorities, and organize sprints.</li>
                    <li><strong>Invite your team:</strong> Add members from the Members page with one click.</li>
                    <li><strong>Monitor metrics:</strong> Track sprint velocity and backlog progress seamlessly.</li>
                  </ul>
                </div>

                <!-- Fallback link -->
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  Direct link to your workspace: <a href="${workspaceUrl}" style="color: #7c3aed; text-decoration: underline;">${workspaceUrl}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  You're receiving this email because you created a TaskFlow workspace.<br>
                  © ${new Date().getFullYear()} TaskFlow Inc. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export const sendWelcomeEmail = async (
  email: string,
  adminName: string,
  workspaceName: string
) => {
  const workspaceUrl = `${ENV.CLIENT_URL}/board`;
  const html = welcomeEmailHtml(adminName, workspaceName, workspaceUrl);
  const text = `Welcome to TaskFlow, ${adminName}!\n\nYour workspace "${workspaceName}" is ready.\nGo to your workspace: ${workspaceUrl}\n\nQuick getting-started steps:\n1. Set up your board: Create tasks and organize sprints.\n2. Invite your team: Add members with one click.\n3. Monitor metrics: Track velocity and progress.\n\nEnjoy collaborating with TaskFlow!`;

  if (!transporter) {
    if (isTestEnv) {
      console.log(`✉️ [Test Mode] SMTP skipped. Welcome email for ${email} (${workspaceName}): ${workspaceUrl}`);
      return { success: true, testMode: true, workspaceUrl };
    }
    console.warn(`⚠️ [SMTP not configured] Welcome email skipped for ${email}`);
    throw new Error('SMTP transporter is not configured.');
  }

  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to: email,
      subject: `Welcome to TaskFlow - Get started with ${workspaceName}`,
      text,
      html,
    });
    console.log(`✉️ Welcome email delivered to ${email}:`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  } catch (error: any) {
    console.error('❌ [sendWelcomeEmail] Error sending welcome email:', {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      command: error?.command,
      recipient: email,
    });
    throw error;
  }
};

export const sendTestEmail = async (to: string) => {
  if (!transporter) {
    throw new Error('SMTP transporter is not configured. Please check SMTP_USER and SMTP_PASS environment variables.');
  }

  const info = await transporter.sendMail({
    from: ENV.EMAIL_FROM,
    to,
    subject: 'TaskFlow SMTP Test Email',
    text: `Hello!\n\nThis is a diagnostic test email from TaskFlow.\nIf you received this, Gmail SMTP delivery is working properly.\n\nTimestamp: ${new Date().toISOString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #7c3aed; margin-top: 0;">TaskFlow SMTP Diagnostic Test</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">This email confirms that your Gmail SMTP configuration is fully operational and messages are being delivered successfully.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `,
  });

  console.log(`✉️ Test email delivered to ${to}:`, {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
};
