import { useState } from "react";
import { X, Shield, Loader2, AlertCircle, Key } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TwoFactorModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorModal({ onSuccess, onCancel }: TwoFactorModalProps) {
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      setError('Please enter a verification code');
      return;
    }
    
    if (!useBackupCode && code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await apiRequest('POST', '/api/auth/2fa/verify-login', {
        token: code,
        isBackupCode: useBackupCode
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const value = useBackupCode 
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  setError("");
                }}
                placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-center ${
                  useBackupCode ? 'text-lg' : 'text-2xl'
                } font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                maxLength={useBackupCode ? 8 : 6}
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {useBackupCode 
                ? 'Enter one of your 8-character backup codes'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </p>
          </div>

          {/* Toggle Backup Code */}
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
              setError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            {useBackupCode 
              ? '← Use authenticator code'
              : 'Use backup code instead'
            }
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !code || (!useBackupCode && code.length !== 6)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Lost your device?</strong> Use one of your backup codes to access your account.
          </p>
        </div>
      </div>
    </div>
  );
}
