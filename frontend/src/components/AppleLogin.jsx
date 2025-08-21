import React from 'react';
import { Button } from './ui/button';

const AppleLogin = ({ onSuccess, onError }) => {
  const handleAppleLogin = async () => {
    try {
      // Check if Apple Sign-In is available
      if (!window.AppleID) {
        throw new Error('Apple Sign-In is not available');
      }

      const response = await window.AppleID.auth.signIn({
        clientId: process.env.REACT_APP_APPLE_CLIENT_ID || 'your.app.bundle.id',
        redirectURI: window.location.origin,
        scope: 'name email',
        responseMode: 'query',
        responseType: 'code id_token',
      });

      // Send the response to your backend
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const result = await fetch(`${backendUrl}/api/auth/apple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: response.code,
          id_token: response.id_token,
          user: response.user,
        }),
      });

      const data = await result.json();
      
      if (result.ok) {
        // Store user data
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('token', data.token);
        
        onSuccess(data.user);
      } else {
        throw new Error(data.detail || 'Apple login failed');
      }
    } catch (error) {
      console.error('Apple login error:', error);
      onError(error.message || 'Apple Sign-In failed. Please try again.');
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleAppleLogin}
      className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200"
    >
      <div className="flex items-center justify-center gap-3">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <span className="text-gray-700 font-medium">Continue with Apple</span>
      </div>
    </Button>
  );
};

export default AppleLogin;