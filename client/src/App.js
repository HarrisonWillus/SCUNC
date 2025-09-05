import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { OrganizationStructuredData } from './components/OrganizationStructuredData';
import { AppProvider } from './utils/appContext';

// Components (keep these as regular imports since they're used on every page)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import './App.css';

// Lazy Import Pages
const Home = lazy(() => import('./pages/Home'));

// Informational Pages
const About = lazy(() => import('./pages/about/About'));
const Secretariat = lazy(() => import('./pages/about/Secretariat'));
const Hotels = lazy(() => import('./pages/about/Hotels'));
const DEI = lazy(() => import('./pages/about/DEI'));

// Committees Pages
const Committees = lazy(() => import('./pages/Committees'));
const CommitteeDetails = lazy(() => import('./pages/CommitteeDetails'));

// Functional Pages
const Schedule = lazy(() => import('./pages/Schedule'));
const Contact = lazy(() => import('./pages/Contact'));
const Register = lazy(() => import('./pages/Register'));

// Admin Pages
const Admin = lazy(() => import('./pages/Admin'));
const LoginCard = lazy(() => import('./components/cards/LoginCard'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #003594',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ color: '#666', fontSize: '16px' }}>Loading...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Component that uses useLocation (must be inside Router)
const AppContent = () => {
  const location = useLocation();

  return (
    <div>
      <OrganizationStructuredData />
      <ScrollToTop />
      <div className='solid__bg'>
        {location.pathname !== '/admin-login' && <Navbar />}

        <main className='content'>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/about/secretariat" element={<Secretariat />} />
              <Route path="/about/hotel" element={<Hotels />} />
              <Route path="/about/dei" element={<DEI />} />
              <Route path="/committees" element={<Committees />} />
              <Route path="/committees/:id" element={<CommitteeDetails />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-dashboard" element={<Admin />} />
              <Route path='/admin-login' element={<LoginCard />} />
            </Routes>
          </Suspense>
        </main>
        
        {location.pathname !== '/admin-login' && <Footer />}
      </div>
      <SpeedInsights />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
};

export default App