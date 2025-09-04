import '../../assets/css/aboutSubclass.css';
import { Link } from 'react-router-dom';
import { DEIinfo } from '../formData';

const DEI = () => {

  return (
    <main>
      <header className='page-header'>
        <div className='header-container'>
            <h1 className='aboutsub-title'>SCUNC Diversity, Equity, and Inclusion Policy</h1>
        </div>
      </header>

      <section className='about-sub-container'>
        <div className='page-content'>
          {DEIinfo.map((dei, index) =>
            <div key={index} className='dei-section'>
              <h2 style={{color: "#003594", marginBottom: "1rem"}}>{dei.title}</h2>
              <p>{dei.text}</p>
            </div>
          )}
        </div>
        <div className='feedback-card'>
          <h2>Report a Concern</h2>
          <p className='subtext'>This anonymous form is exclusively for DEI concerns and will be reviewed only by the Secretary-General and Director-General, who will address the matter promptly. While all questions are optional, providing more details will help us address the issue more effectively.</p>
          <Link to='https://docs.google.com/forms/d/e/1FAIpQLScjS2DV7-1tuLCzsk-68RPwjDE2tzqPSbEy8LEiaZcf2QECVw/viewform' target='blank' className='feedback-button form-button page-button'>Visit Form</Link>
        </div>
      </section>
    </main>
  )
}

export default DEI
