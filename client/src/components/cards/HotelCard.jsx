import { ExternalLink } from 'lucide-react';
import '../../assets/css/aboutSubclass.css';

const HotelCard = ({ hotel }) => {
  const handleImageError = (e) => {
    console.log('❌ Hotel image failed to load:', hotel.picture_url);
    // Set a placeholder or default image
    e.target.style.display = 'none';
  };

  const handleImageLoad = (e) => {
    console.log('✅ Hotel image loaded successfully:', hotel.picture_url);
  };

  return (
    <div className='hotel-card-modern'>
      <div className='hotel-image-container'>
        <img 
          src={hotel.picture_url} 
          alt={`${hotel.name}`} 
          className='hotel-image'
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        <div className='hotel-overlay'>
          <h3 className='hotel-name'>{hotel.name}</h3>
        </div>
      </div>
      
      <div className='hotel-info'>
        {hotel.description && (
          <p className='hotel-description'>{hotel.description}</p>
        )}

        {hotel.amenities && hotel.amenities.length > 0 && (
          <ul className='hotel-amenities'>
            {hotel.amenities.map((amenity, index) => (
              <li key={index} className='hotel-amenity'>
                {amenity}
              </li>
            ))}
          </ul>
        )}

        {hotel.hotel_link && (
          <a 
            href={hotel.hotel_link} 
            target='_blank' 
            rel='noreferrer' 
            className='hotel-link'
          >
            <ExternalLink size={16} />
            Visit Website
          </a>
        )}
      </div>
    </div>
  );
};

export default HotelCard;
