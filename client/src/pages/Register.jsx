import { useEffect, useState} from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { User, Mail, Users, Phone, School, Calendar } from 'lucide-react';
import { useAppContext } from '../utils/appContext';
import { SEOHelmet } from '../components/SEOHelmet';
import '../assets/css/register.css';
import { useRegister } from '../utils/useRegister';

const Register = () => {
  const { isAdmin, loading } = useAppContext();
  const { registerSchool, status, changeRegistrationStatus, fetchRegistrationStatus } = useRegister();

  const [formData, setFormData] = useState({
    personEmail: '',   
    schoolName: '',
    numDelegates: '',
    headDName: '',
    headDCP: '',
    primEmail: '',
    extraInfo: ''
  });

  const inputData = [
    {title: 'Email', name: 'personEmail' ,type: 'email', warning: 'Please enter your email'},
    {title: 'School', name: 'schoolName' ,type: 'text', warning: 'Please enter the name of your school'},
    {title: 'Number of delegates', name: 'numDelegates', type: 'number', warning: 'Please enter the number of delegates for your school'},
    {title: 'Head Delegate name', name: 'headDName', type: 'text', warning: 'Please enter your head delegates name'},
    {title: 'Delegation/Head Delegate email', name: 'primEmail', type: 'email', warning: 'Please enter the head delegates or delegation email'},
    {title: 'Head Delegate phone number', name: 'headDCP', type: 'tel', warning: 'Please enter the head delegates phone number'}
  ];

  useEffect(() => {
    fetchRegistrationStatus();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!formData.personEmail || !formData.schoolName || !formData.numDelegates || !formData.headDName || !formData.headDCP || !formData.primEmail) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const cleanedPhoneNumber = formData.headDCP.replace(/\D/g, '');

    // Create FormData object
    const formDataObj = new FormData();
    formDataObj.append('personEmail', formData.personEmail);
    formDataObj.append('schoolName', formData.schoolName);
    formDataObj.append('numDelegates', formData.numDelegates);
    formDataObj.append('headDName', formData.headDName);
    formDataObj.append('headDCP', cleanedPhoneNumber);
    formDataObj.append('primEmail', formData.primEmail);
    formDataObj.append('extraInfo', formData.extraInfo);

    await registerSchool(formDataObj)
      .then(() => {
        // Reset form
        setFormData({
          personEmail: '',
          schoolName: '',
          numDelegates: '',
          headDName: '',
          headDCP: '',
          primEmail: '',
          extraInfo: ''
        });
      })
  };
  // Icon mapping for form fields
  const getFieldIcon = (fieldName) => {
    const iconMap = {
      'personEmail': Mail,
      'schoolName': School,
      'numDelegates': Users,
      'headDName': User,
      'primEmail': Mail,
      'headDCP': Phone
    };
    return iconMap[fieldName] || User;
  };

  return (
    <>
      <SEOHelmet 
        title="Register - SCUNC 2026"
        description="Register your school for the Steel City United Nations Conference 2026. Early registration: $60/delegation, $65/delegate. Conference dates: February 26th - March 1st, 2026."
        keywords="SCUNC registration, Model UN registration, Pittsburgh MUN, University of Pittsburgh conference, Steel City United Nations Conference registration, delegate registration"
        canonical="https://scuncmun.org/register"
      />
      <main>
      <header className='register-header'>
        <div className='header-container'>
          <h1 className='register-title'>Conference Registration</h1>
          <p className='register-subtitle'>Join us for an unforgettable Model UN experience</p>
        </div>
      </header>

      <section className='register-section'>
        <div className='register-container'>
          {/* Pricing Cards */}
          <div className='pricing-section'>
            <div className='pricing-header'>
              <h2 className='pricing-title'>Registration Pricing</h2>
              <p className='pricing-description'>Choose your registration period for the best rates</p>
            </div>
            
            <div className='pricing-grid'>
              <div className='pricing-card early'>
                <div className='pricing-card-header'>
                  <Calendar size={24} />
                  <h3>Early Registration</h3>
                  <p className='pricing-dates'>September 2nd - November 21st</p>
                </div>
                <div className='pricing-details'>
                  <div className='price-item'>
                    <span className='price-label'>Per Delegation:</span>
                    <span className='price-value'>$60</span>
                  </div>
                  <div className='price-item'>
                    <span className='price-label'>Per Delegate:</span>
                    <span className='price-value'>$65</span>
                  </div>
                </div>
                <div className='pricing-badge best-value'>Best Value</div>
              </div>

              <div className='pricing-card normal'>
                <div className='pricing-card-header'>
                  <Calendar size={24} />
                  <h3>Normal Registration</h3>
                  <p className='pricing-dates'>November 24th - December 19th</p>
                </div>
                <div className='pricing-details'>
                  <div className='price-item'>
                    <span className='price-label'>Per Delegation:</span>
                    <span className='price-value'>$70</span>
                  </div>
                  <div className='price-item'>
                    <span className='price-label'>Per Delegate:</span>
                    <span className='price-value'>$75</span>
                  </div>
                </div>
              </div>

              <div className='pricing-card late'>
                <div className='pricing-card-header'>
                  <Calendar size={24} />
                  <h3>Late Registration</h3>
                  <p className='pricing-dates'>December 22nd - February 6th</p>
                </div>
                <div className='pricing-details'>
                  <div className='price-item'>
                    <span className='price-label'>Per Delegation:</span>
                    <span className='price-value'>$80</span>
                  </div>
                  <div className='price-item'>
                    <span className='price-label'>Per Delegate:</span>
                    <span className='price-value'>$85</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form or Closed Message */}
          <div className='registration-section'>
            {status ? (
              <div className='registration-card'>
                <div className='registration-header'>
                  <div className='registration-icon'>
                    <School size={32} />
                  </div>
                  <h2 className='registration-title'>School Registration</h2>
                  <p className='registration-description'>
                    Complete the form below to register your school for the conference
                  </p>
                </div>

                <form onSubmit={handleSubmit} className='registration-form'>
                  <div className='form-grid'>
                    {inputData.map((item, index) => {
                      const IconComponent = getFieldIcon(item.name);
                      return (
                        <div key={index} className='form-group'>
                          <label className='form-label'>
                            {item.title} <span className='required'>*</span>
                          </label>
                          <div className='input-wrapper'>
                            <IconComponent className='input-icon' size={20} />
                            <input
                              className='form-input'
                              type={item.type}
                              name={item.name}
                              placeholder={`Enter ${item.title.toLowerCase()}`}
                              value={formData[item.name] || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className='form-group full-width'>
                    <label className='form-label'>Additional Comments</label>
                    <div className='input-wrapper'>
                      <textarea
                        className='form-textarea'
                        name='extraInfo'
                        placeholder='Any additional information or special requests...'
                        rows={4}
                        value={formData.extraInfo}
                        onChange={handleChange}
                      />
                    </div>
                    <div className='char-count'>
                      {formData.extraInfo.length} characters
                    </div>
                  </div>

                  <button type='submit' className='submit-button' disabled={loading}>
                    <div className='button-content'>
                      {loading ? (
                        <>
                          <div className='spinner'></div>
                          <span>Registering School...</span>
                        </>
                      ) : (
                        <>
                          <School size={20} />
                          <span>Register School</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            ) : (
              <div className='registration-closed'>
                <div className='closed-icon'>
                  <Calendar size={48} />
                </div>
                <h2 className='closed-title'>Registration Closed</h2>
                <p className='closed-message'>
                  Thank you for your interest! Registration for this conference has ended.
                </p>
                <div className='closed-info'>
                  <p>Stay tuned for future conference announcements</p>
                </div>
              </div>
            )}
          </div>

          {/* Admin Toggle */}
          {isAdmin && (
            <div className="checkbox-wrapper-34 admin-buttons">
              <input 
                className='tgl tgl-ios' 
                id='toggle-34' 
                type='checkbox' 
                checked={status} 
                onChange={(e) => changeRegistrationStatus(e.target.checked)}
              />
              <label className='tgl-btn' htmlFor='toggle-34'></label>
            </div>
          )}
        </div>
      </section>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </main>
    </>
  )
}

export default Register
