import { useState } from 'react';
import { Mail, User, MessageSquare } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import { useAppContext } from '../utils/appContext';
import { useContact } from '../utils/useContact';

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
      
      <ToastContainer position='top-right' autoClose={4000} />
    </main>
  )
}

export default Contact
