import { useEffect, useState } from 'react';
import logo from '../assets/pittmunlogo.png';
import '../assets/css/navbar.css';
import { ChevronRight, ChevronLeft, LogOut } from 'lucide-react'
import { NavLink, Link } from 'react-router-dom';
import { useAppContext } from '../utils/appContext';

const Navbar = () => {
  const { loading, isAdmin, logout} = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [menuView, setMenuView] = useState("main");

const closeMenu = () => {
  setIsOpen(false);
  setMenuView('main');
};

  useEffect(() => {
    if(isOpen) {
      document.body.classList.add('no-scroll');
      document.documentElement.classList.add('no-scroll');
      setMenuView('main');
    }else{
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }
  }, [isOpen]);

  return (
    <nav className='navbar'>
      <section className='navbar-container'>
        <div>
          <Link to='/' onClick={closeMenu}><img src={logo} alt='Logo' className='navbar-logo'/></Link>
        </div>
        <div className='desktop'>
          <div className='navbar-about-wrapper'>
            <NavLink to='/about' className="navbar-link">About</NavLink>
            <div className='navbar-about-content'>
              <NavLink to='/about/hotel' className='navbar-link'>Hotels</NavLink>
              <NavLink to='/about/secretariat' className='navbar-link'>Secretariat</NavLink>
              <NavLink to='/about/dei' className='navbar-link'>DEI policy statement</NavLink>
            </div>
          </div>
            <NavLink to='/committees' className='navbar-link'>Committees</NavLink>
            <NavLink to='/schedule' className='navbar-link'>Schedule</NavLink>
            <NavLink to='/contact' className='navbar-link'>Contact</NavLink>
            {isAdmin && (<NavLink to='/admin-dashboard' className='navbar-link'>Dashboard</NavLink>)}
            <NavLink to='/register' className='page-button navbar-button'>Register</NavLink>
            {isAdmin && <div onClick={() => {logout()}} className={`logout-button ${loading ? 'load' : ''}`} disabled={loading}>{loading ? <div className="logout-loader">Logging Out</div> : <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><LogOut size={16}/>Log Out</div>}</div>}
        </div>
        
        <div className='hamburger-container'>
          <div className={`hamburger ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>

          {isOpen && (
            <div className={`mobile-background ${isOpen ? "in" : "out"}`}>
              {menuView === 'main' && (
                <div className='mobile main-menu'>
                  <Link onClick={() => { setMenuView('about') }} className='navbar-link'>
                    <ChevronRight className='arrow right' size={48}/>About
                  </Link>
                  <Link to='/committees' onClick={closeMenu} className='navbar-link'>Committees</Link>
                  <Link to='/schedule' onClick={closeMenu} className='navbar-link'>Schedule</Link>
                  <Link to='/contact' onClick={closeMenu} className='navbar-link'>Contact</Link>
                  {isAdmin && (<NavLink to='/admin-dashboard' onClick={closeMenu} className='navbar-link'>Dashboard</NavLink>)}
                  <Link to='/register' onClick={closeMenu} className='navbar-link navbar-link-register'>Register</Link>
                  {isAdmin && (
                    <div onClick={() => { logout(); setTimeout(() => { closeMenu(); }, 3000); }} className={`logout-button ${loading ? 'load' : ''}`} disabled={loading}>
                      {loading ? <div className="logout-loader">Logging Out</div> : "Log Out"}
                    </div>
                  )}
                </div>
              )}

            {menuView === 'about' && (
                 <div className='mobile about-menu'>
                  <Link onClick={() => {setMenuView('main')}} className='navbar-link'>
                    Back<ChevronLeft className='arrow left' size={48}/>
                  </Link>
                  <Link to='/about' onClick={closeMenu} className='navbar-link'>About</Link>
                  <Link to='/about/hotel' onClick={closeMenu} className='navbar-link'>Hotels</Link>
                  <Link to='/about/secretariat' onClick={closeMenu} className='navbar-link'>Secretariat</Link>
                  <Link to='/about/dei' onClick={closeMenu} className='navbar-link'>DEI policy statement</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      
    </nav>
  )
}

export default Navbar
