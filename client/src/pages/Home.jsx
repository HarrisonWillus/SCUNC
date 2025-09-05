import { letter } from './formData';
import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, MapPin } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';
import '../assets/css/home.css';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToLetter = () => {
    document.querySelector('.home-letter').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <>
      <SEOHelmet 
        title="SCUNC - Steel City United Nations Conference"
        description="Pittsburgh's first collegiate Model UN conference. Join us February 26th - March 1st, 2026 for an unforgettable diplomatic experience at the University of Pittsburgh."
        keywords="SCUNC, Steel City United Nations Conference, Model UN, Pittsburgh, University of Pittsburgh, Pitt, diplomacy, international relations, February 2026"
        canonical="https://scuncmun.org/"
      />
      <main className='home'>
      <header className='home-hero'>
        <div className='hero-background-overlay'></div>
        <div className='hero-particles'>
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
        
        <div className={`home_container ${isLoaded ? 'animate-in' : ''}`}>
          <h1 className='home-header'>
            <span className='letter-s'>S</span>
            <span className='letter-c'>C</span>
            <span className='letter-u'>U</span>
            <span className='letter-n'>N</span>
            <span className='letter-c2'>C</span>
          </h1>
          
          <div className='home-details'>
            <div className='detail-item'>
              <Calendar size={20} />
              <span>February 26th - March 1st, 2026</span>
            </div>
            <div className='detail-item'>
              <MapPin size={20} />
              <span>Steel City United Nations Conference</span>
            </div>
          </div>
        </div>

        <button className='scroll-indicator' onClick={scrollToLetter}>
          <ChevronDown size={24} />
        </button>
      </header>

      <section className='home-letter'>
        <div className={`home-letter_container ${isLoaded ? 'letter-animate' : ''}`}>
          <div className='letter-header'>
            <h2 className='home-title'>Letter from the Secretary General</h2>
            <div className='title-underline'></div>
          </div>
          
          <div className='letter-content'>
            <h3 className='letter-greeting'>Dear Delegates,</h3>
            {letter.map((section, index) =>
              <p key={index} className='letter-paragraph' style={{animationDelay: `${index * 0.1}s`}}>
                {section.text}
              </p>
            )}
            <div className='letter-signature'>
              <h4 className='ending'>Sincerely,<br /> Maddox Zimmerman</h4>
              <h4 className='ending subtext'>Secretary-General, Steel City United Nations Conference</h4>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

export default Home
