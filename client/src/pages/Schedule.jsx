import { useState, useEffect } from 'react';
import useScreenWidth from '../components/useScreenWidth';
import ScheduleBuilder from '../components/adminButtons/ScheduleBuilder';
import { useAppContext } from '../utils/appContext';
import { useScheduleWorkflow } from '../utils/useScheduleWorkflow';
import { SEOHelmet } from '../components/SEOHelmet';
import { ToastContainer } from 'react-toastify';
import '../assets/css/schedule.css';
import { MapPin, Calendar } from 'lucide-react';

const Schedule = () => {
  const { setShowAnimation, showAnimation, isAdmin } = useAppContext();

  return (
    <>
      <SEOHelmet 
        title="Schedule - SCUNC 2026"
        description="View the detailed conference schedule for SCUNC 2026. Find session times, committee meetings, and special events for February 26th - March 1st, 2026."
        keywords="SCUNC schedule, Model UN schedule, conference schedule, Pittsburgh MUN, Steel City United Nations Conference schedule, February 2026"
        canonical="https://scuncmun.org/schedule"
      />
      <main>
      <header className='page-header-img schedule'>
        <div className='header-container-img' style={{marginTop: '30vh'}}>
          <h1 className='title' style={{fontSize: '32px'}}>Conference Schedule</h1>
        </div>
      </header>

      <section className='schedule-title'>
        <ScheduleDisplay />
      </section>

      {isAdmin && (
        <div className="admin-floating-controls">
          <button 
            onClick={() => {setShowAnimation(!showAnimation)}} 
            className='admin-fab'
          >
            <Calendar size={20} />
          </button>
        </div>
      )}
      <ScheduleBuilder />

      <ToastContainer position="bottom-right" autoClose={3000} />
    </main>
    </>
  );
};

const ScheduleDisplay = () => {
  const { currentSchedule } = useScheduleWorkflow();
  const { loading } = useAppContext();
  const width = useScreenWidth();
  const isMobile = width < 770;

  const [activeIndex, setActiveIndex] = useState(null);
  const [animateClass, setAnimateClass] = useState('');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  // Handles both desktop and mobile
  useEffect(() => {
    if (activeIndex !== null) {
      requestAnimationFrame(() => setAnimateClass('slide-in'));
    }
  }, [activeIndex]);

  if (loading) {
    return (
      <section className='schedule-body'>
        <div className='schedule-loading'>
        </div>
      </section>
    );
  }

  // Check if schedule exists and is published or past release date
  const shouldShowSchedule = currentSchedule && 
    (currentSchedule.is_published || new Date(currentSchedule.release_date) <= new Date());

  if (!shouldShowSchedule) {
    return (
      <section className='schedule-body'>
        <div className='schedule-empty'>
          <h2 className='warning'>The schedule will be released at a later date!</h2>
        </div>
      </section>
    );
  }

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Transform data for legacy component format
  const transformedSchedule = currentSchedule.days?.map(day => ({
    title: [{
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      day: day.label || new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })
    }],
    events: day.events?.map(event => ({
      times: `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`,
      event: event.title,
      location: event.location
    })) || []
  })) || [];

  const handleActive = (cardIndex) => {
    if (activeIndex === cardIndex) {
      // Trigger slide-out
      setAnimateClass('slide-out');
      setIsAnimatingOut(true);
      setTimeout(() => {
        setActiveIndex(null);
        setIsAnimatingOut(false);
      }, 700); // Match your slideOut animation duration
    } else {
      setAnimateClass('slide-in');
      setActiveIndex(cardIndex);
    }
  };

  if (loading) {
    return (
      <section className='schedule-body'>
        <div className='schedule-loading'>
          <p>Loading schedule...</p>
        </div>
      </section>
    );
  }

  if (!transformedSchedule || transformedSchedule.length === 0) {
    return (
      <section className='schedule-body'>
        <div className='schedule-empty'>
          <p>No schedule available at this time.</p>
        </div>
      </section>
    );
  }

  // Add the warning message
  const scheduleContent = (
    <div>
      <h2 className='warning'>Schedule is subject to change</h2>
      {isMobile ? renderMobileSchedule() : renderDesktopSchedule()}
    </div>
  );

  return scheduleContent;

  function renderMobileSchedule() {
    return (
      <section className='schedule-body'>
        <div className='schedule-grid-wrapper'>
          {transformedSchedule.map((card, cardIndex) => (
            <div key={cardIndex} className="schedule-grid">
              <div
                className={`day-card ${activeIndex === cardIndex ? 'active' : ''}`}
                onClick={() => handleActive(cardIndex)}
              >
                {card.title.map((date, dateIndex) => (
                  <div key={dateIndex} className="schedule-container">
                    <h2 className="date">{date.date}</h2>
                    <h3 className="day">{date.day}</h3>
                  </div>
                ))}
              </div>

              {(activeIndex === cardIndex) && (
                <div className={`event-card ${animateClass}`}>
                  <label className="date event-title">Events for {transformedSchedule[cardIndex].title[0].day}</label>
                  {transformedSchedule[cardIndex].events.length > 0 ? (
                    transformedSchedule[cardIndex].events.map((event, index) => (
                      <ul key={index} className="event-item">
                        <li className="time">{event.times}</li>
                        <li className="event">
                          {event.event}
                          {event.location && (
                            <>
                              {' - '}
                              <MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '8px' }} />
                              {event.location}
                            </>
                          )}
                        </li>
                      </ul>
                    ))
                  ) : (
                    <p className="time lower">There are no scheduled events for this day</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderDesktopSchedule() {
    return (
      <section className='schedule-body'>
        <div className="schedule-grid">
          {transformedSchedule.map((card, cardIndex) => (
            <div
              key={cardIndex}
              className={`day-card ${activeIndex === cardIndex ? 'active' : ''}`}
              onClick={() => handleActive(cardIndex)}
            >
              {card.title.map((date, dateIndex) => (
                <div key={dateIndex} className="schedule-container">
                  <h2 className="date">{date.date}</h2>
                  <h3 className="day">{date.day}</h3>
                </div>
              ))}
            </div>
          ))}
        </div>

        {(activeIndex !== null || isAnimatingOut) && (
          <div className="schedule-grid">
            <div className={`event-card ${animateClass}`}>
              <label className="date event-title">Events for {transformedSchedule[activeIndex]?.title[0]?.day}</label>
              {transformedSchedule[activeIndex]?.events.length > 0 ? (
                transformedSchedule[activeIndex].events.map((event, index) => (
                  <ul key={index} className="event-item">
                    <li className="time">{event.times}</li>
                    <li className="event">
                      {event.event}
                      {event.location && (
                        <>
                          {' - '}
                          <MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                          {event.location}
                        </>
                      )}
                    </li>
                  </ul>
                ))
              ) : (
                <p className="time lower">There are no scheduled events for this day</p>
              )}
            </div>
          </div>
        )}
      </section>
    );
  }
};

export default Schedule