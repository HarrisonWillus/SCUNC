import { useState } from 'react';
import { Mail, User, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '../utils/appContext';
import { useContact } from '../utils/useContact';
import { SEOHelmet } from '../components/SEOHelmet';

import '../assets/css/contact.css';

const Contact = () => {
  const { loading } = useAppContext();
  const { sendEmail } = useContact();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
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

    await sendEmail(formData)
      .then(() => {
        toast.success("Email sent successfully!");
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to send email. Please try again.');
      });
  };

  return (
    <>
      <SEOHelmet 
        title="Contact Us - SCUNC 2026"
        description="Get in touch with the Steel City United Nations Conference team. Send us your questions, concerns, or feedback about our Model UN conference."
        keywords="contact SCUNC, Model UN contact, Steel City United Nations Conference, Pittsburgh MUN, University of Pittsburgh contact"
        canonical="https://scuncmun.org/contact"
      />
      <main>
      <section className='contact-container'>
        <div className='contact-card'>
          <div className='contact-header'>
            <div className='contact-icon'>
              <Mail size={32} />
            </div>
            <h2 className='contact-title'>Get in Touch</h2>
            <p className='contact-description'>
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='contact-form'>
            <div className='form-row'>
              <div className='input-group'>
                <label className='contact-message-label'>
                  Name <span className='required'>*</span>
                </label>
                <div className='input-wrapper'>
                  <User className='input-icon' size={20} />
                  <input 
                    className='contact-input'
                    type='text'
                    name='name'
                    placeholder='Your full name'
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className='input-group'>
                <label className='contact-message-label'>
                  Email <span className='required'>*</span>
                </label>
                <div className='input-wrapper'>
                  <Mail className='input-icon' size={20} />
                  <input
                    className='contact-input'
                    type='email'
                    name='email'
                    placeholder='your.email@example.com'
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className='input-group'>
              <label className='contact-message-label'>
                Subject <span className='required'>*</span>
              </label>
              <div className='input-wrapper'>
                <MessageSquare className='input-icon' size={20} />
                <input
                  className='contact-input'
                  type='text'
                  name='subject'
                  placeholder='What is this regarding?'
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className='input-group'>
              <label className='contact-message-label'>
                Message <span className='required'>*</span>
              </label>
              <div className='input-wrapper'>
                <textarea
                  className='contact-textarea'
                  name='message'
                  placeholder='Tell us more about your inquiry...'
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
              <div className='char-count'>
                {formData.message.length} characters
              </div>
            </div>

            <button type='submit' className='my-contact_button' disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</button>
          </form>
        </div>
      </section>
    </main>
    </>
  )
}

export default Contact
