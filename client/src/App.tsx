import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MobileNav } from './components/MobileNav';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { OrganizationSetup } from './components/OrganizationSetup';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="mobile-container">
          <MobileNav />
          <main className="mobile-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/organization-setup" element={<OrganizationSetup />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;