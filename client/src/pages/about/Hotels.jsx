import HotelCard from '../../components/cards/HotelCard';
import HotelManager from '../../components/adminButtons/HotelManager';
import { useAppContext } from '../../utils/appContext';
import { MapPin, Clock, Star, Info, Building2, Wifi, Car } from 'lucide-react';
import { SEOHelmet } from '../../components/SEOHelmet';
import '../../assets/css/aboutSubclass.css';
import { useHotels } from '../../utils/useHotels';
import { ToastContainer } from 'react-toastify';

const Hotels = () => {
  const { isAdmin, setShowAnimation, showAnimation, hotels, loading } = useAppContext();
  // eslint-disable-next-line
  const { fetchHotels } = useHotels();

  console.log('🏨 HOTELS_PAGE: Rendering with hotels:', hotels.length);
  console.log('⏳ HOTELS_PAGE: Loading state:', loading);

  return (
    <>
      <SEOHelmet 
        title="Hotels & Accommodation - SCUNC 2026"
        description="Find premium hotel options near the University of Pittsburgh campus for SCUNC 2026. Discover convenient accommodations within walking distance of conference venues."
        keywords="SCUNC hotels, Pittsburgh hotels, University of Pittsburgh accommodation, Model UN hotels, Steel City United Nations Conference hotels, campus hotels"
        canonical="https://scuncmun.org/about/hotels"
      />
      <main className="hotels-page">
      {/* Hero Section */}
      <section className="hotels-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Building2 size={20} />
            <span>Accommodation</span>
          </div>
          <h1 className="hero-title-hotels">Stay Near Campus</h1>
          <p className="hero-subtitle-hotels">
            Discover premium hotel options within walking distance of the University of Pittsburgh campus. 
            Each carefully selected for comfort, convenience, and proximity to conference venues.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <MapPin size={20} />
              <span>Walking Distance</span>
            </div>
            <div className="stat-item">
              <Clock size={20} />
              <span>24/7 Service</span>
            </div>
            <div className="stat-item">
              <Star size={20} />
              <span>Top Rated</span>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </section>

      <section className="hotels-content">
        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Finding the best hotels for you...</h3>
            <p>Please wait while we load hotel information</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && hotels.length === 0 && (
          <div className="empty-state">
            <Building2 size={48} />
            <h3>No Hotels Available</h3>
            <p>Hotel information will be updated closer to the conference date.</p>
          </div>
        )}

        {/* Hotels Grid */}
        {!loading && hotels.length > 0 && (
          <>
            <div className="section-header">
              <h2>Available Hotels</h2>
              <p>Choose from our curated selection of nearby accommodations</p>
            </div>
            
            <div className="hotels-grid-modern">
              {hotels.map((hotel) => 
                <HotelCard key={hotel.id} hotel={hotel} />
              )}
            </div>
          </>
        )}

        {/* Hotel Block Info Section */}
        <div className="info-card" style={{margin: '2rem 0'}}>
          <div className="info-icon-hotel">
            <Info size={24} />
          </div>
          <div className="info-content">
            <h3>Hotel Block Information</h3>
            <p>
              We're working to secure special conference rates with our partner hotels. 
              Detailed booking information and exclusive rates will be announced closer to the conference date.
            </p>
            <div className="info-features">
              <div className="feature-tag">
                <Wifi size={16} />
                <span>Free WiFi</span>
              </div>
              <div className="feature-tag">
                <Car size={16} />
                <span>Parking Available</span>
              </div>
              <div className="feature-tag">
                <MapPin size={16} />
                <span>Campus Proximity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="tips-section">
          <h3>Booking Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-number">1</div>
              <h4>Book Early</h4>
              <p>Pittsburgh hotels fill up quickly during conference season. Reserve your spot as soon as possible.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">2</div>
              <h4>Check Location</h4>
              <p>Verify walking distance to campus and conference venues before booking.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">3</div>
              <h4>Group Rates</h4>
              <p>Traveling with your team? Contact hotels directly for potential group discounts.</p>
            </div>
          </div>
        </div>

        {/* Admin Button */}
        {isAdmin && (
          <button 
            onClick={() => {setShowAnimation(!showAnimation)}} 
            className="admin-fab"
            title="Manage Hotels"
          >
            <Building2 size={20} />
          </button>
        )}

        {isAdmin && <HotelManager />}
      </section>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </main>
    </>
  )
}

export default Hotels
