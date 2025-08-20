import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MobileNav } from './components/MobileNav';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { OrganizationSetup } from './components/OrganizationSetup';
import { SetupComplete } from './components/SetupComplete';
import { GettingStarted } from './components/GettingStarted';
import { AssetsPage } from './components/AssetsPage';
import { AssetDetails } from './components/AssetDetails';
import { WorkOrdersPage } from './components/WorkOrdersPage';
import { WorkOrderDetails } from './components/WorkOrderDetails';
import { WorkOrderEdit } from './components/WorkOrderEdit';
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
              <Route path="/setup-complete" element={<SetupComplete />} />
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/:id" element={<AssetDetails />} />
              <Route path="/work-orders" element={<WorkOrdersPage />} />
              <Route path="/work-orders/:id" element={<WorkOrderDetails />} />
              <Route path="/work-orders/:id/edit" element={<WorkOrderEdit />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;