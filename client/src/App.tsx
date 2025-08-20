import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MobileNav } from './components/MobileNav';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="mobile-container">
        <MobileNav />
        <main className="mobile-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;