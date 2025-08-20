import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
  };

  const handleGoogleSuccess = (user: { name: string; email: string; picture: string; given_name?: string; family_name?: string }) => {
    login(user);
    // Check if organization setup is needed
    const orgSetup = localStorage.getItem('organizationSetup');
    if (!orgSetup) {
      navigate('/organization-setup');
    } else {
      navigate('/');
    }
  };

  const handleGoogleError = (error: string) => {
    console.error('Google login error:', error);
  };

  return (
    <div className="page-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Sign in to your Nexus account</p>
        
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <GoogleLoginButton 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '2rem 0',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
          <div style={{ padding: '0 1rem' }}>or continue with email</div>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mobile-input touch-target"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mobile-input touch-target"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '10px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="mobile-button touch-target"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            Sign In
          </button>
          
          <button 
            type="button" 
            className="mobile-button touch-target"
            style={{ 
              width: '100%', 
              background: 'transparent',
              color: '#646cff',
              border: '2px solid #646cff'
            }}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}