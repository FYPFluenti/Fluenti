import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  Download,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userType?: "child" | "adult";
}

export function TwoFactorSetup({ isOpen, onClose, onSuccess, userType = "adult" }: TwoFactorSetupProps) {
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  
  // UI State
  const [currentStep, setCurrentStep] = useState<'status' | 'setup' | 'verify' | 'disable'>('status');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check 2FA status on mount
  useEffect(() => {
    if (!isOpen) return;
    
    const check2FAStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/2fa/status');
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
      } catch (error) {
        console.error('Failed to check 2FA status:', error);
        setError('Failed to check 2FA status');
      } finally {
        setCheckingStatus(false);
      }
    };
    
    check2FAStatus();
  }, [isOpen]);

  // Setup 2FA
  const handleSetup2FA = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/setup', {});
      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setCurrentStep('setup');
      } else {
        setError(data.message || 'Failed to setup 2FA');
      }
    } catch (error: any) {
      console.error('2FA setup error:', error);
      setError('Failed to setup 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify and enable 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/verify', {
        token: verificationCode
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('2FA enabled successfully! Save your backup codes in a secure location.');
        setTwoFactorEnabled(true);
        setVerificationCode("");
        setCurrentStep('status');
        onSuccess?.();
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!disablePassword) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/disable', {
        password: disablePassword
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('2FA disabled successfully');
        setTwoFactorEnabled(false);
        setCurrentStep('status');
        setDisablePassword("");
        onSuccess?.();
      } else {
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (error: any) {
      console.error('2FA disable error:', error);
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = `Fluenti Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes in a safe place!
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to login.
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluenti-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setCurrentStep('status');
    setQrCode("");
    setSecret("");
    setBackupCodes([]);
    setVerificationCode("");
    setDisablePassword("");
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  const childFriendly = userType === "child";
  
  // Design system based on user type
  const styles = {
    // Modal background
    modalBg: childFriendly 
      ? "bg-background dark:bg-gray-800" 
      : "bg-white dark:bg-gray-800",
    
    // Card/section backgrounds
    cardBg: childFriendly 
      ? "bg-muted hover:bg-accent" 
      : "bg-gray-50 dark:bg-gray-700/50",
    
    // Primary accent color
    primaryBtn: childFriendly 
      ? "bg-[#ff6b1d] hover:bg-[#e55a15]" 
      : "bg-purple-600 hover:bg-purple-700",
    
    // Text colors
    titleText: childFriendly 
      ? "text-foreground" 
      : "text-gray-800 dark:text-white",
    
    bodyText: childFriendly 
      ? "text-muted-foreground" 
      : "text-gray-600 dark:text-gray-400",
    
    // Input styling
    input: childFriendly 
      ? "border border-border dark:bg-background dark:text-foreground" 
      : "border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
    
    // Success/error colors
    success: childFriendly 
      ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" 
      : "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    
    error: childFriendly 
      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" 
      : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
      
    // Icon accent
    iconAccent: childFriendly 
      ? "text-[#ff6b1d]" 
      : "text-purple-600 dark:text-purple-400"
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className={`${styles.modalBg} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 ${styles.modalBg} border-b ${childFriendly ? 'border-border' : 'border-gray-200 dark:border-gray-700'} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${childFriendly ? 'bg-muted' : 'bg-green-100 dark:bg-green-900/30'} rounded-lg`}>
                <Shield className={`w-6 h-6 ${childFriendly ? styles.iconAccent : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <h2 className={`text-2xl font-bold ${styles.titleText}`}>
                {childFriendly ? "Extra Security" : "Two-Factor Authentication"}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className={`${styles.bodyText} hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {checkingStatus && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`h-8 w-8 animate-spin ${styles.iconAccent}`} />
              <span className={`ml-2 ${styles.bodyText}`}>Checking security status...</span>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className={`mb-4 p-4 ${styles.error} rounded-lg flex items-center gap-3`}>
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Messages */}
          {success && (
            <div className={`mb-4 p-4 ${styles.success} rounded-lg flex items-center gap-3`}>
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {!checkingStatus && (
            <>
              {/* Status View */}
              {currentStep === 'status' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      twoFactorEnabled 
                        ? childFriendly ? 'bg-green-50 dark:bg-green-900/30' : 'bg-green-100 dark:bg-green-900/30'
                        : styles.cardBg
                    }`}>
                      {twoFactorEnabled ? (
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <Shield className={`w-8 h-8 ${styles.bodyText}`} />
                      )}
                    </div>
                    
                    <h3 className={`text-xl font-semibold ${styles.titleText} mb-2`}>
                      {twoFactorEnabled ? (
                        childFriendly ? "Extra Security is ON! 🛡️" : "2FA is Active"
                      ) : (
                        childFriendly ? "Make Your Account Super Safe!" : "2FA is Not Active"
                      )}
                    </h3>
                    
                    <p className={`${styles.bodyText} mb-6`}>
                      {twoFactorEnabled ? (
                        childFriendly 
                          ? "Your account has an extra layer of protection! You'll need your phone to log in."
                          : "Your account is protected with two-factor authentication."
                      ) : (
                        childFriendly
                          ? "Add an extra lock to your account! Even if someone knows your password, they can't get in without your phone."
                          : "Add an extra layer of security to your account with two-factor authentication."
                      )}
                    </p>
                  </div>

                  {/* Benefits List */}
                  {!twoFactorEnabled && (
                    <div className={`${styles.cardBg} rounded-lg p-4 mb-6 ${childFriendly ? 'border border-border' : ''}`}>
                      <h4 className={`font-medium ${styles.titleText} mb-3`}>
                        {childFriendly ? "Why is this awesome?" : "Benefits of 2FA:"}
                      </h4>
                      <ul className={`space-y-2 text-sm ${styles.bodyText}`}>
                        <li className="flex items-start gap-2">
                          <CheckCircle className={`h-4 w-4 ${styles.iconAccent} mt-0.5 flex-shrink-0`} />
                          {childFriendly 
                            ? "Keeps your account super safe from bad people"
                            : "Protects your account even if your password is compromised"
                          }
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className={`h-4 w-4 ${styles.iconAccent} mt-0.5 flex-shrink-0`} />
                          {childFriendly
                            ? "Works with apps on your phone or tablet"
                            : "Works with popular authenticator apps"
                          }
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className={`h-4 w-4 ${styles.iconAccent} mt-0.5 flex-shrink-0`} />
                          {childFriendly
                            ? "Gives you special backup codes just in case"
                            : "Provides backup codes for emergencies"
                          }
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {!twoFactorEnabled ? (
                      <button
                        onClick={handleSetup2FA}
                        disabled={loading}
                        className={`w-full ${styles.primaryBtn} text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                        {childFriendly ? "Turn On Extra Security" : "Enable 2FA"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentStep('disable')}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        {childFriendly ? "Turn Off Extra Security" : "Disable 2FA"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Setup View */}
              {currentStep === 'setup' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className={`text-xl font-semibold ${styles.titleText} mb-2`}>
                      {childFriendly ? "Step 1: Scan the Magic Code" : "Step 1: Scan QR Code"}
                    </h3>
                    <p className={`${styles.bodyText} mb-4`}>
                      {childFriendly 
                        ? "Ask a grown-up to help you scan this with your phone's camera or an authenticator app"
                        : "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"
                      }
                    </p>
                  </div>

                  {qrCode && (
                    <div className="flex justify-center mb-4">
                      <div className={`bg-white p-4 rounded-lg ${childFriendly ? 'border border-border' : 'shadow-lg'}`}>
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                  )}

                  {secret && (
                    <div className={`${styles.cardBg} rounded-lg p-4 ${childFriendly ? 'border border-border' : ''}`}>
                      <h4 className={`font-medium ${styles.titleText} mb-2`}>
                        {childFriendly ? "Secret Code (for grown-ups):" : "Manual Entry Code:"}
                      </h4>
                      <code className={`text-sm font-mono ${styles.bodyText} break-all`}>
                        {secret}
                      </code>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentStep('verify')}
                    className={`w-full ${styles.primaryBtn} text-white py-3 px-4 rounded-lg font-medium transition-colors`}
                  >
                    {childFriendly ? "I Scanned It! Next Step →" : "Next: Verify Setup"}
                  </button>
                </div>
              )}

              {/* Verify View */}
              {currentStep === 'verify' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className={`text-xl font-semibold ${styles.titleText} mb-2`}>
                      {childFriendly ? "Step 2: Enter the Magic Number" : "Step 2: Verify Setup"}
                    </h3>
                    <p className={styles.bodyText}>
                      {childFriendly 
                        ? "Look at your phone app and type the 6-digit number you see"
                        : "Enter the 6-digit code from your authenticator app"
                      }
                    </p>
                  </div>

                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${styles.titleText} mb-2`}>
                        {childFriendly ? "Magic Number (6 digits)" : "Verification Code"}
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`w-full px-4 py-3 ${styles.input} rounded-lg text-center font-mono text-lg tracking-widest`}
                        placeholder="000000"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('setup')}
                        className={`flex-1 ${childFriendly ? 'bg-muted hover:bg-accent text-foreground' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'} py-3 px-4 rounded-lg font-medium transition-colors`}
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || verificationCode.length !== 6}
                        className={`flex-1 ${styles.primaryBtn} text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {childFriendly ? "Activate!" : "Verify & Enable"}
                      </button>
                    </div>
                  </form>

                  {/* Backup Codes Preview */}
                  {backupCodes.length > 0 && (
                    <div className={`${childFriendly ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800' : 'bg-yellow-50 dark:bg-yellow-900/30'} rounded-lg p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Key className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                          {childFriendly ? "Emergency Codes" : "Backup Codes"}
                        </h4>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                        {childFriendly 
                          ? "After you activate, you'll get special emergency codes. Ask a grown-up to save them safely!"
                          : "After enabling 2FA, you'll receive backup codes. Save them securely!"
                        }
                      </p>
                      <button
                        type="button"
                        onClick={downloadBackupCodes}
                        className="inline-flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
                      >
                        <Download className="w-4 h-4" />
                        {childFriendly ? "Download Emergency Codes" : "Download Backup Codes"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Disable View */}
              {currentStep === 'disable' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className={`text-xl font-semibold ${styles.titleText} mb-2`}>
                      {childFriendly ? "Turn Off Extra Security?" : "Disable Two-Factor Authentication"}
                    </h3>
                    <div className={`${childFriendly ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800' : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'} rounded-lg p-4 mb-4`}>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {childFriendly 
                          ? "⚠️ This will make your account less safe. Are you sure you want to do this?"
                          : "⚠️ Disabling 2FA will make your account less secure."
                        }
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleDisable2FA} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${styles.titleText} mb-2`}>
                        {childFriendly ? "Your Password" : "Confirm with Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showDisablePassword ? "text" : "password"}
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          className={`w-full px-4 py-3 pr-12 ${styles.input} rounded-lg`}
                          placeholder={childFriendly ? "Enter your password" : "Enter your password to confirm"}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDisablePassword(!showDisablePassword)}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${styles.bodyText} hover:text-foreground`}
                        >
                          {showDisablePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('status')}
                        className={`flex-1 ${childFriendly ? 'bg-muted hover:bg-accent text-foreground' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'} py-3 px-4 rounded-lg font-medium transition-colors`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !disablePassword}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        {childFriendly ? "Turn Off" : "Disable 2FA"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}