import { 
  Users, 
  Mail, 
  School, 
  Phone, 
  User, 
  MessageSquare, 
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAppContext } from '../utils/appContext';
import '../assets/css/admin.css';
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../utils/useRegister';

const Admin = () => {
  const { schools } = useAppContext();
  const { status, handleDelete, isCheckingAuth, isAuthenticated } = useRegister();
  const navigate = useNavigate();

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    navigate('/admin-login');
    return;
  }

  return (
    <main>
      <header className='admin-header'>
        <div className='admin-header-container'>
          <div className='header-left'>
            <div className='header-text'>
              <h1 className='admin-title'>Admin Dashboard</h1>
              <p className='admin-subtitle'>Manage school registrations and conference data</p>
            </div>
          </div>
        </div>
      </header>

      <section className='dashboard-stats'>
        <div className='stats-container'>
          <div className='stat-card'>
            <div className='stat-icon schools'>
              <School size={28} />
            </div>
            <div className='stat-content'>
              <h3 className='stat-number'>{schools.length}</h3>
              <p className='stat-label'>Registered Schools</p>
            </div>
          </div>
          
          <div className='stat-card'>
            <div className='stat-icon delegates'>
              <Users size={28} />
            </div>
            <div className='stat-content'>
              <h3 className='stat-number'>
                {schools.reduce((total, school) => total + parseInt(school.num_delegates || 0), 0)}
              </h3>
              <p className='stat-label'>Total Delegates</p>
            </div>
          </div>

          <div className='stat-card'>
            <div className={status ? 'stat-icon activity' : 'stat-icon not-activity'}>
              <BarChart3 size={28} />
            </div>
            <div className='stat-content'>
              <h3 className='stat-number'>{status ? 'Live' : 'Closed'}</h3>
              <p className='stat-label'>Registration Status</p>
            </div>
          </div>
        </div>
      </section>

      <section className='schools-section'>
        <div className='schools-grid'>
          {schools.length > 0 ? (
            schools.map((school) => (
              <div key={school.id} className='school-card'>
                <div className='school-header'>
                  <div className='school-icon'>
                    <School size={24} />
                  </div>
                  <div className='school-title-container'>
                    <h3 className='school-name'>{school.school_name}</h3>
                    <span className='school-id'>ID: {school.id}</span>
                  </div>
                  <div className='delegate-badge'>
                    <Users size={16} />
                    <span>{school.num_delegates}</span>
                  </div>
                </div>

                <div className='school-details'>
                  <div className='detail-row'>
                    <div className='detail-item'>
                      <User className='detail-icon' size={18} />
                      <div className='detail-content'>
                        <label>Head Delegate</label>
                        <span>{school.head_delegate_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className='detail-row'>
                    <div className='detail-item'>
                      <Mail className='detail-icon' size={18} />
                      <div className='detail-content'>
                        <label>Contact Email</label>
                        <span>{school.person_email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className='detail-row'>
                    <div className='detail-item'>
                      <Mail className='detail-icon' size={18} />
                      <div className='detail-content'>
                        <label>Primary Email</label>
                        <span>{school.primary_email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className='detail-row'>
                    <div className='detail-item'>
                      <Phone className='detail-icon' size={18} />
                      <div className='detail-content'>
                        <label>Phone Number</label>
                        <span>{formatPhoneNumber(school.head_delegate_contact_phone)}</span>
                      </div>
                    </div>
                  </div>

                  {school.extra_info && (
                    <div className='detail-row full-width'>
                      <div className='detail-item'>
                        <MessageSquare className='detail-icon' size={18} />
                        <div className='detail-content'>
                          <label>Additional Comments</label>
                          <span className='comment-text'>{school.extra_info}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className='school-footer'>
                  <div className='registration-date'>
                    <Calendar size={16} />
                    <span>Registered: {new Date().toLocaleDateString()}</span>
                  </div>
                    <button className='action-btn delete' onClick={() => handleDelete(school.id)}>Delete</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-schools">
              <div className='no-schools-icon'>
                <School size={48} />
              </div>
              <h3 className='no-schools-title'>No Registrations Yet</h3>
              <p className='no-schools-message'>
                School registrations will appear here once they start coming in.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Admin;
