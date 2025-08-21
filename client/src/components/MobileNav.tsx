import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function MobileNav() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="mobile-nav">
      <h1>Nexus</h1>
      
      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link 
            to="/dashboard" 
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '15px',
              background: location.pathname.startsWith('/dashboard') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              fontSize: '0.9rem'
            }}
          >
            Dashboard
          </Link>
          <Link 
            to="/assets" 
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '15px',
              background: location.pathname.startsWith('/assets') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              fontSize: '0.9rem'
            }}
          >
            Assets
          </Link>
          <Link 
            to="/work-orders" 
            style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '15px',
              background: location.pathname.startsWith('/work-orders') ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              fontSize: '0.9rem'
            }}
          >
            Work Orders
          </Link>
          {user?.picture && (
            <img 
              src={user.picture} 
              alt={user.name}
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            />
          )}
          <span style={{ fontSize: '0.9rem' }}>Hi, {user?.given_name || user?.name}</span>
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '15px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <ul className="nav-menu">
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/login" 
              className={location.pathname === '/login' ? 'active' : ''}
            >
              Login
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}