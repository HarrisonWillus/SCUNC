import { useRef, useState } from 'react'
import { useAppContext } from '../../utils/appContext';
import { XIcon, ChevronUp } from 'lucide-react';
import { useContact } from '../../utils/useContact';
import '../../assets/css/footer.css';

const EmailCard = () => {
  const { message, setMessage, loading, showContact, setShowContact } = useAppContext();
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
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (
      formData.name === '' ||
      formData.email === '' ||
      formData.subject === '' ||
      formData.message === ''
    ) {
      setMessage(prev => ({ ...prev, error: "Please complete all the fields!" }));
      return;
    }

    await sendBusinessEmail(formData)
      .then(() => {
        setMessage({ success: "Email sent successfully!" });
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
        setMessage({ error: error.message || 'Failed to send email. Please try again.' });
      });
  };

  return (
    <div className={`my-contact-form ${showContact ? 'open' : 'close'}`}>
        <XIcon className='edit-menu-buttons close' onClick={() => {setShowContact(false);}} size={25} />

        <h1 className='my-title'>Let's Connect</h1>
        <h2 className='my-subtitle'>Any questions or remarks? Just write me a message! </h2>

        <form onSubmit={handleSubmit}>
            <div style={{display: 'flex', gap: '2rem'}}>
            <div>
                <label >First Name<p className='required'>*</p></label>
                <input 
                name='firstName'
                className='my-contact_input'
                value={formData.firstName}
                onChange={handleChange}
                />
            </div>

            <div>
                <label >Last Name<p className='required'>*</p></label>
                <input 
                name='lastName'
                className='my-contact_input'
                value={formData.lastName}
                onChange={handleChange}
                />
            </div>
        </div>

        <div>
            <label >Company / Organization Name<p className='required' style={{fontSize: '12px', alignContent: 'end'}}>optional</p></label>
            <input 
            name='organization'
                className='my-contact_input'
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

            {!loading ? (
                <button type='submit' className='my-contact-button page-button' style={{padding: '.5rem 1.5rem'}}>Send Message</button>
            ) : (
                <button className={`save-button page-button ${loading ? 'load' : ''}`} style={{pointerEvents: 'none'}} disabled={loading}>{loading ? <div className="logout-loader">{message.progress}</div> : message.success}</button>
            )}
        </form>
    </div>
  )
}

export default EmailCard
