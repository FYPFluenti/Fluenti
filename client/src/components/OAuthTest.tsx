import React from 'react';

const OAuthTest: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  return (
    <div style={{ padding: '20px' }}>
      <h2>OAuth Configuration Test</h2>
      <div>
        <p><strong>Google Client ID:</strong> {googleClientId ? '✅ Loaded' : '❌ Missing'}</p>
        <p><strong>Facebook App ID:</strong> {facebookAppId ? '✅ Loaded' : '❌ Missing'}</p>
      </div>
      
      {googleClientId && (
        <p>Google Client ID: {googleClientId.substring(0, 20)}...</p>
      )}
      
      {facebookAppId && (
        <p>Facebook App ID: {facebookAppId}</p>
      )}
    </div>
  );
};

export default OAuthTest;