export function HomePage() {
  return (
    <div className="page-container">
      <div className="welcome-card">
        <h1>Welcome to Nexus</h1>
        <p>Your elegant mobile-first experience starts here</p>
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
        </ul>
      </div>
    </div>
  );
}