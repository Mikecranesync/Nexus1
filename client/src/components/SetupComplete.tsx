import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SetupComplete() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="page-container">
      <div className="setup-complete-container">
        <div className="checkmark-container">
          <div className="checkmark-circle">
            <svg 
              className="checkmark-icon"
              viewBox="0 0 24 24" 
              width="48" 
              height="48"
            >
              <path 
                fill="none" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M20 6L9 17l-5-5"
                className="checkmark-path"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="setup-complete-title">
          Setup Complete!
        </h1>
        
        <p className="setup-complete-message">
          You are ready to go!
        </p>
        
        <div className="redirect-info">
          <p>Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="mobile-button touch-target"
          style={{
            marginTop: '1rem',
            background: 'rgba(100, 108, 255, 0.1)',
            color: '#646cff',
            border: '2px solid #646cff'
          }}
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}