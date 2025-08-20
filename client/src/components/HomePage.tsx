import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  
  // Get organization setup data if it exists
  const getOrganizationData = () => {
    const orgData = localStorage.getItem('organizationSetup');
    return orgData ? JSON.parse(orgData) : null;
  };
  
  const orgData = getOrganizationData();

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
        
        <button className="mobile-button touch-target">
          Get Started
        </button>
        <button className="mobile-button touch-target">
          Learn More
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