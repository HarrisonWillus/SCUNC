import { Link } from 'react-router-dom';
import '../assets/css/footer.css';
import { InstagramIcon } from 'lucide-react';

const Footer = () => {

  return (
    <main className='footer'>
      <section className='footer-grid'>
        <div className='footer-content'>
          <h3 className='footer-title'>SCUNC</h3>
          <p style={{fontWeight: 200, fontSize: '14px'}}>Steel City United Nations Conference <br/>University of Pittsburgh<br/>February 26th - March 1st 2026</p>
        </div>
        <div className='footer-content'> 
           <h3 className='footer-title'>Resources</h3>
          <div className='footer-links-content'>
            <ul className='footer-links'>
              <p className='footer-subtext'>Quick Links</p>
              <li className='footer-link'><Link to='/about' >About</Link></li>
              <li className='footer-link'><Link to='/committees'>Committees</Link></li>
              <li className='footer-link'><Link to='/schedule'>Schedule</Link></li>
              <li className='footer-link'><Link to='/contact'>Contact</Link></li>
              <li className='footer-link'><Link to='/register'>Register</Link></li>
            </ul>
            <ul className='footer-links'>
              <p className='footer-subtext' style={{fontSize: '17px'}}>Additional Links</p>
              <li className='footer-link'><Link to='/about/secretariat'>Secretariat</Link></li>
              <li className='footer-link'><Link to='/about/hotel'>Hotels</Link></li>
              <li className='footer-link'><Link to='/about/dei'>DEI Policy Statement</Link></li>
            </ul>
          </div>
          
          <div className='footer-extra'>
            <Link to='https://maps.app.goo.gl/EF8h2LQ9dNZLPxhc6' target='_blank' style={{cursor: 'default'}}><p>4200 Fifth Ave. <br/> Pittsburgh, PA 15260</p></Link>
            <Link to='https://www.instagram.com/scuncmun?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' target='blank'><InstagramIcon className='footer-media'/></Link>
          </div>
          <p className='text-left'><a href='mailto:scuncmun@gmail.com'>scuncmun@gmail.com</a></p>
        </div>
      </section> 
      
      <div className='credits'>
        <p>© 2025 Harrison Williams · John Carroll University</p>
      </div>
    </main>
  )
}

export default Footer
