import { Link } from 'react-router-dom';
import { ChevronRight, Users, Globe, Award, ArrowDown } from 'lucide-react';
import '../../assets/css/about.css';
import { aboutInfo, infoCardInfo } from '../formData';
import TestimonialCard from '../../components/cards/TestimonialCard';
import { useAppContext } from '../../utils/appContext';
import AddQuote from '../../components/adminButtons/AddQuote';
import { useQuotes } from '../../utils/useQuotes';
import { useEffect } from 'react';

const About = () => {
  const { isAdmin, setShowQuoteManager, quotes } = useAppContext();
  const { fetchQuotes } = useQuotes();

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line
  }, []);

  const getIconForCard = (index) => {
    const icons = [Users, Globe, Award];
    const IconComponent = icons[index];
    return <IconComponent size={48} className="info-card-icon" />;
  };

  return (
    <main className="about-main">
      {/* Hero Section */}
      <section className='about-hero'>
        <div className='hero-overlay'></div>
        <div className='hero-content'>
          <div className='hero-text'>
            <h1 className='hero-title'>About SCUNC</h1>
            <p className='hero-subtitle'>Forged in Steel, United in Diplomacy</p>
            <p className='hero-description'>Pittsburgh's First Collegiate Model UN Conference</p>
            <div className='hero-cta-container'>
              <Link to='/register' className='hero-cta primary'>
                Register Now
                <ChevronRight size={20} />
              </Link>
              <ArrowDown size={24} className='scroll-arrow' />
              <Link to='/about/secretariat' className='hero-cta secondary'>
                Meet Our Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className='section welcome-section'>
        <div className='section-container'>
          <div className='section-header'>
            <h2 className='section-title'>Pittsburgh's First Collegiate Model UN Conference</h2>
          </div>
          <div className='content-wrapper'>
            <p className='section-text'>{aboutInfo.welcome}</p>
            <div className='action-buttons'>
              <Link to='/about/secretariat' className='action-btn'>
                <Users size={20} />
                Meet the Secretariats
              </Link>
              <Link to='/register' className='action-btn primary'>
                <ChevronRight size={20} />
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Origin Section with Info Cards */}
      <section className='section origin-section'>
        <div className='section-container'>
          <div className='section-header'>
            <h2 className='section-title'>A Student-Led Vision from the Ground Up</h2>
          </div>
          <p className='section-text'>{aboutInfo.origin}</p>
          
          <div className='info-cards-grid'>
            {infoCardInfo.map((info, index) => 
              <div key={index} className='modern-info-card'>
                <div className='card-icon-wrapper'>
                  {getIconForCard(index)}
                </div>
                <h3 className='card-title'>{info.title}</h3>
                <p className='card-text'>{info.text}</p>
              </div>
            )}
          </div>
          
          <div className='action-buttons'>
            <Link to='/committees' className='action-btn'>
              <Globe size={20} />
              Explore Committees
            </Link>
            <Link to='/schedule' className='action-btn'>
              <Award size={20} />
              View Schedule
            </Link>
          </div>
        </div>
      </section>

      {/* Purpose Section */}
      <section className='section purpose-section'>
        <div className='section-container purpose-container'>
          <div className='purpose-content'>
            <div className='section-header left-aligned'>
              <h2 className='section-title purpose-title'>Where diplomacy meets purpose.</h2>
            </div>
            <p className='section-text left-aligned' style={{paddingLeft: '3rem'}}>{aboutInfo.why}</p>
          </div>
          <div className='testimonial-wrapper'>
            <TestimonialCard quotes={quotes} />
          </div>
        </div>
      </section>

      {/* Committees Section */}
      <section className='section committees-section'>
        <div className='section-container'>
          <div className='section-header'>
            <h2 className='section-title'>Creative Formats, Unconventional Topics</h2>
          </div>
          <p className='section-text'>{aboutInfo.committees}</p>
          
          <div className='committees-showcase'>
            <h3 className='showcase-title'>Committees We Offer</h3>
            <div className='committee-cards'>
              <Link to='/committees' className='committee-card-show crisis'>
                <div className='card-gradient'></div>
                <span className='committee-type'>Crisis Committee</span>
              </Link>
              <Link to='/committees' className='committee-card-show assembly'>
                <div className='card-gradient'></div>
                <span className='committee-type'>Specialized General Assembly</span>
              </Link>
              <Link to='/committees' className='committee-card-show ecosoc'>
                <div className='card-gradient'></div>
                <span className='committee-type'>ECOSOC</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="admin-floating-controls">
          <button
            className='admin-fab'
            onClick={() => {setShowQuoteManager(true)}}
            title="Edit Quotes"
          >
            <Award size={24} />
          </button>
        </div>
      )}

      <AddQuote />
    </main>
  )
}

export default About
