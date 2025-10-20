import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

const APP_NAME = 'Fluenti AI';

/**
 * Generate 2FA secret for user
 */
export function generate2FASecret(email: string): { secret: string; otpauth_url: string } {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    issuer: APP_NAME,
    length: 32,
  });
  
  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url!,
  };
}

/**
 * Generate QR code for 2FA setup
 */
export async function generateQRCode(otpauth_url: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after (60 seconds window)
  });
}

/**
 * Generate backup codes (8 codes, 10 characters each)
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random code (10 characters, alphanumeric)
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    // Format as XXXX-XXXX-XX
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 10)}`;
    codes.push(formatted);
  }
  
  return codes;
}

/**
 * Hash backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

/**
 * Remove used backup code
 */
export function removeBackupCode(code: string, hashedCodes: string[]): string[] {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.filter(c => c !== hashedInput);
}
