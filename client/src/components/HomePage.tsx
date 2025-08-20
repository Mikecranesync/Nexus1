import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Get organization setup data if it exists
  const getOrganizationData = () => {
    const orgData = localStorage.getItem('organizationSetup');
    return orgData ? JSON.parse(orgData) : null;
  };
  
  const orgData = getOrganizationData();

  // Handle Learn More button click
  const handleLearnMore = () => {
    if (isAuthenticated && orgData) {
      // For fully setup users, go to getting started
      navigate('/getting-started');
    } else {
      // For others, scroll to features
      const featuresSection = document.querySelector('.welcome-card:last-child');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Handle Get Started button click
  const handleGetStarted = () => {
    if (!isAuthenticated) {
      // User is not logged in, redirect to login
      navigate('/login');
    } else if (!orgData) {
      // User is logged in but hasn't completed organization setup
      navigate('/organization-setup');
    } else {
      // User is fully set up, redirect to getting started page
      navigate('/getting-started');
    }
  };

  return (
    <div className="page-container">
      <div className="welcome-card">
        <h1>Welcome to Nexus</h1>
        {isAuthenticated && orgData ? (
          <div>
            <p>Welcome back to <strong>{orgData.name}</strong>!</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Industry: {orgData.industry.charAt(0).toUpperCase() + orgData.industry.slice(1).replace('-', ' ')}
            </p>
          </div>
        ) : (
          <p>Your elegant mobile-first experience starts here</p>
        )}
        
        <button 
          className="mobile-button touch-target"
          onClick={handleGetStarted}
        >
          {!isAuthenticated 
            ? 'Get Started' 
            : !orgData 
              ? 'Complete Setup' 
              : 'Explore Features'
          }
        </button>
        <button 
          className="mobile-button touch-target"
          onClick={handleLearnMore}
        >
          {isAuthenticated && orgData ? 'View Checklist' : 'Learn More'}
        </button>
      </div>
      
      <div className="welcome-card">
        <h2>Features</h2>
        <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
          <li>✨ Mobile-first design</li>
          <li>🚀 Progressive Web App</li>
          <li>🎨 Touch-friendly interface</li>
          <li>📱 Works offline</li>
          {isAuthenticated && <li>🏢 Organization setup</li>}
        </ul>
      </div>
    </div>
  );
}