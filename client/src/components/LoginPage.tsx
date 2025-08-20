import { useState } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
  };

  return (
    <div className="page-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Sign in to your Nexus account</p>
        
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
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