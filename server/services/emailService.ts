import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@fluenti.ai';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    // Debug environment variables
    console.log('📧 [EMAIL DEBUG] Configuration check:', {
      EMAIL_HOST: EMAIL_HOST || 'NOT SET',
      EMAIL_PORT: EMAIL_PORT || 'NOT SET',
      EMAIL_USER: EMAIL_USER ? '***@' + EMAIL_USER.split('@')[1] : 'NOT SET',
      EMAIL_PASSWORD: EMAIL_PASSWORD ? '***' + EMAIL_PASSWORD.slice(-4) : 'NOT SET'
    });
    
    // Only create transporter if email credentials are provided
    if (EMAIL_USER && EMAIL_PASSWORD) {
      transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });
    } else {
      console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in environment variables.');
      // Return a mock transporter for development
      transporter = {
        sendMail: async (mailOptions: any) => {
          console.log('📧 [MOCK EMAIL] Would send email:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            preview: mailOptions.html?.substring(0, 100) + '...',
          });
          return { messageId: 'mock-' + Date.now() };
        },
      } as any;
    }
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  console.log('📧 [EMAIL DEBUG] sendEmail called with:', {
    to: options.to,
    subject: options.subject,
    from: EMAIL_FROM,
    hasHtml: !!options.html,
    hasText: !!options.text
  });
  
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.error('❌ [EMAIL DEBUG] No transporter available');
      throw new Error('Email service not configured');
    }
    
    console.log('📧 [EMAIL DEBUG] Attempting to send email...');
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    console.log('✅ Email sent successfully to:', options.to, 'MessageId:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('❌ [EMAIL DEBUG] Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code,
      command: (error as any)?.command
    });
    throw new Error('Failed to send email');
  }
}

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #5568d3; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .token { background: #fff; border: 2px dashed #ddd; padding: 15px; margin: 15px 0; word-break: break-all; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Fluenti!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Thank you for signing up for Fluenti - your AI-powered speech therapy platform!</p>
          <p>To complete your registration and start your speech therapy journey, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="token">${verificationUrl}</div>
          
          <p><strong>This verification link will expire in 24 hours.</strong></p>
          
          <p>If you didn't create an account with Fluenti, please ignore this email.</p>
          
          <p>Best regards,<br>The Fluenti Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fluenti AI. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Welcome to Fluenti!
    
    Hi ${firstName},
    
    Thank you for signing up for Fluenti - your AI-powered speech therapy platform!
    
    To complete your registration, please verify your email address by visiting this link:
    ${verificationUrl}
    
    This verification link will expire in 24 hours.
    
    If you didn't create an account with Fluenti, please ignore this email.
    
    Best regards,
    The Fluenti Team
  `;
  
  await sendEmail({
    to: email,
    subject: '✅ Verify your Fluenti account',
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #e04658; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        .token { background: #fff; border: 2px dashed #ddd; padding: 15px; margin: 15px 0; word-break: break-all; font-family: monospace; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>We received a request to reset your password for your Fluenti account.</p>
          <p>Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="token">${resetUrl}</div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0;">
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will remain unchanged until you create a new one</li>
            </ul>
          </div>
          
          <p>For security reasons, this link can only be used once.</p>
          
          <p>Best regards,<br>The Fluenti Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fluenti AI. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Password Reset Request
    
    Hi ${firstName},
    
    We received a request to reset your password for your Fluenti account.
    
    To create a new password, visit this link:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this reset, please ignore this email.
    Your password will remain unchanged until you create a new one.
    
    Best regards,
    The Fluenti Team
  `;
  
  await sendEmail({
    to: email,
    subject: '🔒 Reset your Fluenti password',
    html,
    text,
  });
}

/**
 * Send account lockout notification email
 */
export async function sendAccountLockoutEmail(
  email: string,
  firstName: string,
  unlockTime: Date
): Promise<void> {
  const formattedTime = unlockTime.toLocaleString();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #ffe5e5; border-left: 4px solid #ff6b6b; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Account Security Alert</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          
          <div class="warning">
            <strong>⚠️ Your account has been temporarily locked</strong>
            <p>We detected multiple failed login attempts on your account.</p>
          </div>
          
          <p><strong>Account will be unlocked at:</strong> ${formattedTime}</p>
          
          <p><strong>What should you do?</strong></p>
          <ul>
            <li>Wait for the lockout period to expire (30 minutes)</li>
            <li>If this wasn't you, reset your password immediately</li>
            <li>Contact support if you need immediate assistance</li>
          </ul>
          
          <p>This is an automated security measure to protect your account from unauthorized access.</p>
          
          <p>Best regards,<br>The Fluenti Security Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fluenti AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Account Security Alert
    
    Hi ${firstName},
    
    Your account has been temporarily locked due to multiple failed login attempts.
    
    Account will be unlocked at: ${formattedTime}
    
    If this wasn't you, please reset your password immediately.
    
    Best regards,
    The Fluenti Security Team
  `;
  
  await sendEmail({
    to: email,
    subject: '🔐 Account Security Alert - Account Locked',
    html,
    text,
  });
}

/**
 * Send 2FA setup email
 */
export async function send2FASetupEmail(
  email: string,
  firstName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Two-Factor Authentication Enabled</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          
          <div class="success">
            <strong>✅ Two-Factor Authentication has been enabled on your account!</strong>
          </div>
          
          <p>Your Fluenti account is now protected with an additional layer of security.</p>
          
          <p><strong>What this means:</strong></p>
          <ul>
            <li>You'll need to enter a verification code when logging in</li>
            <li>The code will be generated by your authenticator app</li>
            <li>Your account is now more secure against unauthorized access</li>
          </ul>
          
          <p><strong>Important:</strong> Keep your backup codes in a safe place. You'll need them if you lose access to your authenticator app.</p>
          
          <p>If you didn't enable 2FA, please contact support immediately.</p>
          
          <p>Best regards,<br>The Fluenti Security Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Fluenti AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Two-Factor Authentication Enabled
    
    Hi ${firstName},
    
    Two-Factor Authentication has been enabled on your Fluenti account!
    
    Your account is now protected with an additional layer of security.
    
    You'll need to enter a verification code from your authenticator app when logging in.
    
    If you didn't enable 2FA, please contact support immediately.
    
    Best regards,
    The Fluenti Security Team
  `;
  
  await sendEmail({
    to: email,
    subject: '🔐 Two-Factor Authentication Enabled',
    html,
    text,
  });
}
