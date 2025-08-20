import { Link, useLocation } from 'react-router-dom';

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav">
      <h1>Nexus</h1>
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
    </nav>
  );
}