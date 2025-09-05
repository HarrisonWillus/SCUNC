import { useRef, useState } from 'react'
import { useAppContext } from '../../utils/appContext';
import { XIcon, ChevronUp } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { useContact } from '../../utils/useContact';
import '../../assets/css/footer.css';

const EmailCard = () => {
  const { loading, showContact, setShowContact } = useAppContext();
  const { sendBusinessEmail } = useContact();

  const [isSelectOpenR, setIsSelectOpenR] = useState(false);
  const referralRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    organization: '',
    referral: '',
  });
  const referralOptions = [
    {label: "This website", value: '0'},
    {label: 'Friend', value: '1'},
    {label: 'Family Member', value: '2'},
    {label: 'Business Associate', value: '3'}
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (
      formData.name === '' ||
      formData.email === '' ||
      formData.subject === '' ||
      formData.message === ''
    ) {
      toast.error("Please complete all the fields!");
      return;
    }

    await sendBusinessEmail(formData)
      .then(() => {
        toast.success("Email sent successfully!");
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          organization: '',
          referral: '',
        });
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to send email. Please try again.');
      });
  };

  return (
    <div className={`my-contact-form ${showContact ? 'open' : 'close'}`}>
        <XIcon className='edit-menu-buttons close' onClick={() => {setShowContact(false);}} size={25} />

        <h1 className='my-title'>Let's Connect</h1>
        <h2 className='my-subtitle'>Any questions or remarks? Just write me a message! </h2>

        <form onSubmit={handleSubmit}>
          <div>
              <label >Name<p className='required'>*</p></label>
              <input
              name='name'
              className='my-contact_input'
              value={formData.name}
              onChange={handleChange}
              />
          </div>

          <div>
              <label >Company / Organization Name<p className='required' style={{fontSize: '12px', alignContent: 'end'}}>optional</p></label>
              <input 
                name='organization'
                className='my-contact_input'
                value={formData.organization}
                onChange={handleChange}
            />
          </div>

          <div>
              <label>Email<p className='required'>*</p></label>
              <input 
              name="email"
              className="my-contact_input"
              value={formData.email}
              onChange={handleChange}
              />
          </div>

          <div>
              <label >Subject / Reason for contact<p className='required'>*</p></label>
              <input 
                  name='subject'
                  className='my-contact_input'
                  value={formData.subject}
                  onChange={handleChange}
              />
          </div>

          <div>
              <label >Message / Project Details<p className='required'>*</p></label>
              <textarea
                  name='message'
                  className='my-contact_input'
                  placeholder='Write your message...'
                  value={formData.message}
                  onChange={handleChange}
                  style={{height: '15vh'}}
              />
          </div>

          <div>
              <label> Where did you hear about me?<p className='required' style={{fontSize: '12px', alignContent: 'end'}}>optional</p></label>
              <div ref={referralRef} className='custom-select'>
              <div className={`select-box ${isSelectOpenR ? 'opened' : ''}`} onClick={() => setIsSelectOpenR(!isSelectOpenR)}>
                  {formData.referral ? formData.referral : "Select a referral option"}
                  <ChevronUp className={`arrow-change ${isSelectOpenR ? 'opened' : ''}`} size={25}/>
              </div>
              {isSelectOpenR && 
                  <ul className='options-list'>
                  {referralOptions.map((option) => (
                      <li 
                      className={`options ${formData.referral ? "selected" : ""}`} 
                      key={option.value}
                      onClick={() => {
                          setFormData(prev => ({...prev, referral: option.label}));
                          setIsSelectOpenR(false);
                      }}
                      >
                      {option.label}
                      </li>
                  ))}
                  </ul>
              }
              </div>
          </div>

            <button type='submit' className='my-contact_button' disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
        </form>
        <ToastContainer position='top-right' autoClose={4000} />
    </div>
  )
}

export default EmailCard
