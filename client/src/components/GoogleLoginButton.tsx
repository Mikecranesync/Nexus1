import { useEffect, useRef } from 'react';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

interface GoogleLoginButtonProps {
  onSuccess: (user: GoogleUser) => void;
  onError?: (error: string) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  // Demo client ID - replace with your actual Google OAuth client ID
  const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';

  useEffect(() => {
    const handleCredentialResponse = (response: { credential: string }) => {
      try {
        // Decode the JWT token to get user info
        const userInfo = parseJwt(response.credential);
        onSuccess(userInfo);
      } catch {
        console.error('Error parsing Google credential');
        onError?.('Failed to process Google login');
      }
    };

    if (typeof window !== 'undefined' && window.google && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: '280',
      });
    }
  }, [onSuccess, onError]);


  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      throw new Error('Invalid token');
    }
  };

  // Fallback button if Google SDK isn't loaded
  const handleFallbackLogin = () => {
    // Simulate Google login for demo purposes
    const demoUser = {
      name: 'Demo User',
      email: 'demo@example.com',
      picture: 'https://via.placeholder.com/96x96?text=Demo',
      given_name: 'Demo',
      family_name: 'User'
    };
    onSuccess(demoUser);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div ref={buttonRef}></div>
      
      {/* Fallback demo button */}
      <button
        onClick={handleFallbackLogin}
        className="mobile-button"
        style={{
          background: 'white',
          color: '#1f1f1f',
          border: '2px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          padding: '0.75rem 1.5rem',
          width: '280px',
          justifyContent: 'center'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google (Demo)
      </button>
      
      <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', margin: 0 }}>
        Note: Configure your Google OAuth client ID to enable real Google login
      </p>
    </div>
  );
}