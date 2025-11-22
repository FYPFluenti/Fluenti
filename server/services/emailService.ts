import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { Resend } from 'resend';
import * as brevo from '@getbrevo/brevo';

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@fluenti.ai';
// For Resend, use their domain until custom domain is verified
const RESEND_FROM = process.env.RESEND_FROM || 'Fluenti <onboarding@resend.dev>';
// Brevo configuration
const BREVO_FROM = process.env.BREVO_FROM || 'Fluenti <fluenitai@gmail.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// Resend configuration (HTTP API - bypasses SMTP blocks)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Brevo configuration (HTTP API - 300 emails/day free, no domain verification required)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
let bretvoApi: brevo.TransactionalEmailsApi | null = null;
if (BREVO_API_KEY) {
  bretvoApi = new brevo.TransactionalEmailsApi();
  bretvoApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
}

// Fallback SMTP configurations for production environments (based on known working solutions)
const SMTP_CONFIGS = [
  // Primary: Resend SMTP (specifically designed to work with Render/Vercel)
  {
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY // Resend API key as password
    },
    name: 'Resend SMTP (Render-compatible)'
  },
  // Fallback 1: Gmail service method (most reliable according to StackOverflow)
  {
    service: 'Gmail',
    port: null, // service handles port automatically
    secure: null, // service handles security automatically  
    name: 'Gmail Service'
  },
  // Fallback 2: Gmail SMTP with requireTLS (proven solution for Render/server environments)
  {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    name: 'Gmail SMTP (TLS 587 with requireTLS)'
  },
  // Fallback 3: Gmail SMTP with SSL
  {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    name: 'Gmail SMTP (SSL 465)'
  }
];

// Create transporter
let transporter: nodemailer.Transporter | null = null;

async function createTransporterWithFallback() {
  console.log('📧 [EMAIL DEBUG] Configuration check:', {
    EMAIL_HOST: EMAIL_HOST || 'NOT SET',
    EMAIL_PORT: EMAIL_PORT || 'NOT SET',
    EMAIL_USER: EMAIL_USER ? '***@' + EMAIL_USER.split('@')[1] : 'NOT SET',
    EMAIL_PASSWORD: EMAIL_PASSWORD ? '***' + EMAIL_PASSWORD.slice(-4) : 'NOT SET'
  });
  
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in environment variables.');
    return {
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

  // Try each SMTP configuration until one works
  for (const config of SMTP_CONFIGS) {
    try {
      console.log(`📧 [EMAIL DEBUG] Trying ${config.name}...`);
      
      // Create transport configuration based on the configuration type
      let transportConfig: any = {
        connectionTimeout: 5000, // 5 seconds timeout for faster fallback
        greetingTimeout: 3000,
        socketTimeout: 5000,
      };

      if ((config as any).service) {
        // Service-based configuration (e.g., Gmail service)
        transportConfig.service = (config as any).service;
        transportConfig.auth = {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        };
      } else if ((config as any).auth) {
        // Special auth configuration (e.g., Resend with custom auth)
        transportConfig.host = (config as any).host;
        transportConfig.port = (config as any).port;
        transportConfig.secure = (config as any).secure;
        transportConfig.auth = (config as any).auth;
        if ((config as any).requireTLS) {
          transportConfig.requireTLS = (config as any).requireTLS;
        }
      } else {
        // Standard host-based configuration
        transportConfig.host = (config as any).host;
        transportConfig.port = (config as any).port;
        transportConfig.secure = (config as any).secure;
        transportConfig.auth = {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        };
        if ((config as any).requireTLS) {
          transportConfig.requireTLS = (config as any).requireTLS;
        }
      }
      
      const testTransporter = nodemailer.createTransport(transportConfig);

      // Test the connection with a quick timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection test timeout')), 8000);
        testTransporter.verify((error, success) => {
          clearTimeout(timeout);
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });

      console.log(`✅ [EMAIL DEBUG] Successfully connected using ${config.name}`);
      return testTransporter;
    } catch (error) {
      console.log(`❌ [EMAIL DEBUG] ${config.name} failed:`, (error as any)?.message);
      continue;
    }
  }

  throw new Error('All SMTP configurations failed');
}

function getTransporter() {
  if (!transporter) {
    // Create a promise-based transporter that will be resolved when needed
    transporter = {
      sendMail: async (mailOptions: any) => {
        const workingTransporter = await createTransporterWithFallback();
        return workingTransporter.sendMail(mailOptions);
      }
    } as any;
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
 * Send email using Resend HTTP API (primary) or nodemailer SMTP (fallback)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  console.log('📧 [EMAIL DEBUG] sendEmail called with:', {
    to: options.to,
    subject: options.subject,
    from: EMAIL_FROM,
    hasHtml: !!options.html,
    hasText: !!options.text,
    resendAvailable: !!resend,
    brevoAvailable: !!bretvoApi
  });
  
  // Try Brevo HTTP API first (300 emails/day free, no domain verification required)
  if (bretvoApi) {
    try {
      console.log('📧 [EMAIL DEBUG] Attempting to send via Brevo HTTP API...');
      
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: options.to }];
      // Use verified sender email and proper formatting to avoid spam
      sendSmtpEmail.sender = { 
        email: 'fluenitai@gmail.com', 
        name: 'Fluenti Support Team' 
      };
      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.html;
      sendSmtpEmail.textContent = options.text;
      // Add reply-to to improve deliverability
      sendSmtpEmail.replyTo = { email: 'fluenitai@gmail.com', name: 'Fluenti Support' };
      
      const result = await bretvoApi.sendTransacEmail(sendSmtpEmail);
      
      console.log('✅ Email sent successfully via Brevo HTTP API to:', options.to, 'MessageId:', result.body.messageId);
      return;
    } catch (error) {
      console.error('❌ Brevo HTTP API failed:', (error as any)?.message);
      console.log('📧 [EMAIL DEBUG] Falling back to Resend...');
    }
  } else {
    console.log('📧 [EMAIL DEBUG] Brevo not configured, trying Resend...');
  }
  
  // Try Resend HTTP API as second option (works with Render but has domain restrictions)
  if (resend) {
    try {
      console.log('📧 [EMAIL DEBUG] Attempting to send via Resend HTTP API...');
      
      const result = await resend.emails.send({
        from: RESEND_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }
      
      console.log('✅ Email sent successfully via Resend HTTP API to:', options.to, 'ID:', result.data?.id);
      return;
    } catch (error) {
      console.error('❌ Resend HTTP API failed:', (error as any)?.message);
      console.log('📧 [EMAIL DEBUG] Falling back to SMTP...');
    }
  } else {
    console.log('📧 [EMAIL DEBUG] Resend not configured, using SMTP fallback...');
  }
  
  // Fallback to SMTP (for local development or if Resend fails)
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      throw new Error('Failed to initialize email transporter');
    }
    
    console.log('📧 [EMAIL DEBUG] Attempting to send email with SMTP fallback mechanism...');
    
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    console.log('✅ Email sent successfully via SMTP to:', options.to, 'MessageId:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send email after trying all methods:', error);
    console.error('❌ [EMAIL DEBUG] Final error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      code: (error as any)?.code,
      command: (error as any)?.command
    });
    throw new Error('Failed to send email via Brevo, Resend, and SMTP');
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
  
  const text = `Password Reset Request

Hello ${firstName},

You have requested to reset your password for your Fluenti account. This is a security measure to protect your account.

To create a new password, please visit this link:
${resetUrl}

This secure link will expire in 1 hour for your protection.

If you did not request this password reset, please ignore this email. Your password will remain unchanged until you create a new one.

Best regards,
Fluenti Support Team

---
This is an automated security email from Fluenti.
Please do not reply to this email.`;
  
  await sendEmail({
    to: email,
    subject: 'Password Reset - Fluenti Account',
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
