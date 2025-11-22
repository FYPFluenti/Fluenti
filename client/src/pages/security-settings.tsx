import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@/types/auth";
import { 
  Shield, 
  Mail, 
  Key, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

export default function SecuritySettings() {
  const { user, isLoading: authLoading } = useAuth() as { 
    user: User | null; 
    isLoading: boolean;
  };
  const [, setLocation] = useLocation();
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check 2FA status on mount
  useEffect(() => {
    if (!user) return;
    
    const check2FAStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/2fa/status');
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
      } catch (error) {
        console.error('Failed to check 2FA status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    check2FAStatus();
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [authLoading, user, setLocation]);

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
        setShowSetup2FA(true);
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
        setShow2FADisable(false);
        setDisablePassword("");
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

  // Close setup modal
  const closeSetupModal = () => {
    setShowSetup2FA(false);
    setQrCode("");
    setSecret("");
    setBackupCodes([]);
    setVerificationCode("");
    setError("");
    setSuccess("");
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation('/settings')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2 sm:gap-3">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
            Security Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your account security and authentication methods</p>
        </div>

        {/* Global Messages */}
        {error && !showSetup2FA && !show2FADisable && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && !showSetup2FA && !show2FADisable && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Email Verification Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-foreground">Email Verification</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.emailVerified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Not Verified</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-foreground">Extra Security (2FA) </h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra lock to your account to keep it super safe!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {twoFactorEnabled ? (
                <>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                    Enabled
                  </span>
                  <button
                    onClick={() => setShow2FADisable(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition disabled:opacity-50"
                  >
                    Turn Off
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                    Disabled
                  </span>
                  <button
                    onClick={handleSetup2FA}
                    disabled={loading}
                    className="px-4 py-2 bg-[#ff6b1d] text-white rounded-lg hover:bg-[#e55a15] transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</>
                    ) : (
                      'Turn On Extra Security'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {twoFactorEnabled ? (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>Extra Security is ON!</strong> Your account is super safe! You'll need your phone to log in. 
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Why make your account super safe?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Extra Security adds a special lock to your account! Even if someone knows your password, they can't get in without your phone.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  Keeps your account safe from bad people
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  Works with special apps on your phone
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  Gives you emergency codes just in case
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* 2FA Setup Modal */}
        {showSetup2FA && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">Setup Two-Factor Authentication</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
              )}

              {!twoFactorEnabled ? (
                <>
                  {/* Step 1: Scan QR Code */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Step 1: Scan QR Code
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use Google Authenticator, Authy, or any TOTP authenticator app to scan this QR code:
                    </p>
                    {qrCode && (
                      <div className="flex justify-center mb-4">
                        <img src={qrCode} alt="2FA QR Code" className="border-4 border-border rounded-lg" />
                      </div>
                    )}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Or enter this key manually:</p>
                      <code className="text-sm font-mono break-all text-foreground">{secret}</code>
                    </div>
                  </div>

                  {/* Step 2: Verify Code */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Step 2: Verify Code
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter the 6-digit code from your authenticator app:
                    </p>
                    <form onSubmit={handleVerify2FA}>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-4 py-3 border border-border rounded-lg text-center text-2xl font-mono tracking-widest bg-background text-foreground"
                        maxLength={6}
                        disabled={loading || twoFactorEnabled}
                      />
                      <button
                        type="submit"
                        disabled={loading || verificationCode.length !== 6 || twoFactorEnabled}
                        className="w-full mt-3 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
                        ) : (
                          'Verify and Enable'
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : null}

              {/* Step 3: Backup Codes */}
              {backupCodes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Step 3: Save Backup Codes
                  </h3>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                      <strong>⚠️ Important:</strong> Save these backup codes in a secure location. Each code can only be used once.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-muted border border-border rounded text-center font-mono text-sm text-foreground">
                        {code}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={downloadBackupCodes}
                    className="w-full bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Backup Codes
                  </button>
                </div>
              )}

              <button
                onClick={closeSetupModal}
                className="w-full bg-muted hover:bg-muted/80 text-foreground py-3 rounded-lg font-semibold transition"
              >
                {twoFactorEnabled ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* 2FA Disable Modal */}
        {show2FADisable && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Disable Two-Factor Authentication</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>⚠️ Warning:</strong> Disabling 2FA will make your account less secure.
                </p>
              </div>

              <form onSubmit={handleDisable2FA}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Enter your password to confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showDisablePassword ? "text" : "password"}
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-background text-foreground"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDisablePassword(!showDisablePassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showDisablePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShow2FADisable(false);
                      setDisablePassword("");
                      setError("");
                    }}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-3 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !disablePassword}
                    className="flex-1 bg-red-600 dark:bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Disabling...</>
                    ) : (
                      'Disable 2FA'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
