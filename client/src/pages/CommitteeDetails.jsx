import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../utils/appContext';
import { SEOHelmet } from '../components/SEOHelmet';
import { ToastContainer } from 'react-toastify';
import { 
  ArrowLeft, 
  Download, 
  Users, 
  Globe, 
  Sparkles,
  Settings,
  ArrowRight
} from 'lucide-react';
import '../assets/css/committeeDetails.css';
import { useCommittees } from '../utils/useCommittees';
import AddCommittee from '../components/adminButtons/AddCommittee';

const CommitteeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { committees, categories, isAdmin, showAnimation, setShowAnimation } = useAppContext();
  // eslint-disable-next-line
  const { fetchCommittees } = useCommittees();

  // Find committee by ID from URL parameter
  const committee = committees.find(c => c.id === id);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If committee not found, show error state
  if (!committee) {
    return (
      <div className="committee-error">
        <div className="error-content">
          <Users size={64} />
          <h1>Committee Not Found</h1>
          <p>The committee you're looking for doesn't exist or may have been removed.</p>
          <Link to="/committees" className="back-button">
            <ArrowLeft size={20} />
            Back to Committees
          </Link>
        </div>
      </div>
    );
  }

  const category = categories.find(cat => cat.id === committee.category_id);

  return (
    <>
      <SEOHelmet 
        title={`${committee.title} - SCUNC 2026`}
        description={`Learn about the ${committee.title} committee at SCUNC 2026. ${committee.description ? committee.description.substring(0, 150) : 'Explore topics, download background guides, and register for this Model UN committee.'}`}
        keywords={`${committee.title}, SCUNC committee, Model UN committee, ${category?.title || 'committee'}, Steel City United Nations Conference`}
        canonical={`https://scuncmun.org/committees/${committee.id}`}
      />
      <div className="committee-details">
      {/* Hero Section */}
      <section className="hero-section">
        <div 
          className="hero-background"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            backgroundImage: committee.image_url ? `url(${committee.image_url})` : 'none'
          }}
        >
          <div className="hero-overlay" />
        </div>
        
        <div className="hero-content">
          <button onClick={() => navigate('/committees')} className="back-nav">
            <ArrowLeft size={20} />
            <span>Back to Committees</span>
          </button>

          <div className="hero-main">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>{category?.title || 'Committee'}</span>
            </div>
            
            <h1 className="hero-title">{committee.title}</h1>

            {committee.background_guide_url && (
              <a 
                href={committee.background_guide_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="cta-primary"
              >
                <Download size={20} />
                <span>Download Background Guide</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Topics Section */}
        {committee.topics && committee.topics.length > 0 && 
          <section className="content-section">
            <div className="section-container">
              <h2>Discussion Topics</h2>
                <div className="topics-grid">
                  {committee.topics.map((topic, index) => (
                    <div key={topic.id || index} className="topic-card">
                      <div className="topic-number">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <h3>{topic.topic}</h3>
                    </div>
                  ))}
                </div>
            </div>
          </section>
        }

        {/* Committee Info */}
        <section className="content-section">
          <div className="section-container">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">
                  <Globe size={32} />
                </div>
                <h3>Committee Overview</h3>
                <p>{committee.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-container">
            <h2>Ready to Join This Committee?</h2>
            <p>Register now to secure your spot and start preparing for an amazing MUN experience</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-primary">
                <Users size={20} />
                <span>Register Now</span>
              </Link>
              <Link to="/committees" className="cta-secondary">
                <span>Explore More Committees</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {isAdmin && (
        <div className='admin-floating-controls'>
          <button
            className='admin-fab'
            onClick={() => {
              setShowAnimation(!showAnimation);
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      <AddCommittee />

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
    </>
  );
};

export default CommitteeDetails;
