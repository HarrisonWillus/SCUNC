import { useState } from 'react';
import { Eye, EyeOff, User, Lock, LogIn } from 'lucide-react';
import { useAppContext } from '../../utils/appContext';
import { useAuth } from '../../utils/useAuth';
import logo from '../../assets/pittmunlogo.png';
import '../../assets/css/LoginCard.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginCard = () => {
  // Context and Hooks
  const { loading } = useAppContext();
  const { handleLogin } = useAuth();

  // Local State
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Handle form input changes
  const handleChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email validation
    if (!credentials.email) {
      toast.error('Email address is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Password validation
    if (!credentials.password) {
      toast.error('Password is required');
      return;
    }
    
    if (credentials.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    await handleLogin(credentials.email.toLowerCase().trim(), credentials.password);
    
    // Reset form on success (if needed)
    setCredentials({ email: '', password: '' });
  };

  return (
    <div className="login-card-container">
      <div className="login-card">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo-container">
            <img src={logo} alt='PITTMUN Logo' className='login-logo'/>
          </div>
          <h1 className='login-title'>Admin Portal</h1>
          <p className='login-subtitle'>Sign in to access the dashboard</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className='login-form'>
          {/* Email Field */}
          <div className="input-group">
            <label className='input-label'>Email Address</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                className='login-input'
                type='text'
                placeholder='Enter your email'
                value={credentials.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="input-group">
            <label className='input-label'>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                className='login-input'
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                value={credentials.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            className={`login-button ${loading ? 'loading' : ''}`} 
            type='submit' 
            disabled={loading || !credentials.email || !credentials.password}
          >
            {loading ? (
              <div className="button-content">
                <div className="spinner"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              <div className="button-content">
                <LogIn size={20} />
                <span>Sign In</span>
              </div>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="footer-text">
            Secure admin access for PITTMUN organizers
          </p>
          <a href='/' className="footer-text-link">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;
