import { useRef, useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

import '../../assets/css/about.css';
import pittmunlogo from '../../assets/pittmunlogo.png';

const TestimonialCard = ({ quotes }) => {
    const sliderRef = useRef(null);
    const cardRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      if (!quotes || quotes.length === 0) return;

      const interval = setInterval(() => {
        if (!isHovered) {
          setCurrentSlide(prev => (prev + 1) % quotes.length);
        }
      }, 8000);
      return () => clearInterval(interval);
      
    }, [quotes, isHovered]);

    useEffect(() => {
      const slider = sliderRef.current;
      const card = cardRef.current;
    
      if (!slider || !card) return;
    
      const slideWidth = card.offsetWidth + 0;
      slider.style.transform = `translateX(${-currentSlide * slideWidth}px)`;
    }, [currentSlide]);

    const handleImageError = (e) => {
      e.target.src = pittmunlogo;
    };

    if (!quotes || quotes.length === 0) {
      return (
        <div className='testimonial-container'>
          <div className='testimonial-card'>
            <img
              src={pittmunlogo}
              alt='Pittsburgh MUN Logo'
              className='testimonial-pfp'
            />
            <h3 className='quote-title'>No testimonials available</h3>
            <p className='quote-info'>Check back soon for delegate experiences!</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className='testimonial-container'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className='testimonial-track' ref={sliderRef}>
          {quotes.map((quote, index) =>
            <div key={index} className='testimonial-card' ref={index === 0 ? cardRef : null}>
              <div className='quote-icon-wrapper'>
                <Quote size={24} className='quote-icon' />
              </div>
              <img
                src={quote.picture_url || pittmunlogo}
                alt={`${quote.name || 'Anonymous'} headshot`}
                className='testimonial-pfp'
                onError={handleImageError}
              />
              <h3 className='quote-title'>{quote.title || 'Testimonial'}</h3>
              <p className='quote-info'>{quote.quote || 'No quote available'}</p>
              <div className='quote-author'>
                <h4 className='quote-title bottom'>{quote.name || 'Anonymous'}</h4>
                <p className='quote-subtext'>{quote.position || 'Participant'}</p>
              </div>
            </div>
          )}
        </div>
        
        {quotes.length > 1 && (
          <div className="slider-controls">
            {quotes.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    )
}

export default TestimonialCard;