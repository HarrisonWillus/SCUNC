import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { AppProvider } from './utils/appContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Import Pages
import Home from './pages/Home';

// Informational Pages
import About from './pages/about/About';
import Secretariat from './pages/about/Secretariat';
import Hotels from './pages/about/Hotels';
import DEI from './pages/about/DEI';

// Committees Pages
import Committees from './pages/Committees';
import CommitteeDetails from './pages/CommitteeDetails';

// Functional Pages
import Schedule from './pages/Schedule';
import Contact from './pages/Contact';
import Register from './pages/Register';

// Admin Pages
import Admin from './pages/Admin';
import LoginCard from './components/cards/LoginCard';

import './App.css';

// Component that uses useLocation (must be inside Router)
const AppContent = () => {
  const location = useLocation();

  return (
    <div>
      <ScrollToTop />
      <div className='solid__bg'>
        {location.pathname !== '/admin-login' && <Navbar />}

        <main className='content'>
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