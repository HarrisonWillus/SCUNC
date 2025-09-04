import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Create the context
const AppContext = createContext();

// Custom hook to use the AppContext
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider = ({ children }) => {

  // Utility States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({error: null, success: null, warning: null});
  const [showAnimation, setShowAnimation] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showOrderManager, setShowOrderManager] = useState(false);
  const [showQuoteManager, setShowQuoteManager] = useState(false);

  // User State
  const [isAdmin, setIsAdmin] = useState(null);

  // Logout function
  const logout = () => {
    sessionStorage.removeItem('token');
    setIsAdmin(false);
    toast.info('You have been logged out successfully.');
  };

  // Db States
  const [schools, setSchools] = useState([]);
  const [secretariates, setSecretariates] = useState([]);
  const [schedule, setSchedule] = useState(null); // Single schedule instead of array
  const [days, setDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [hotels, setHotels] = useState([]);

  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    // check if token is there and is valid if it is setIsAdmin to true
    const token = sessionStorage.getItem('token');
    if (token) {
      fetch('/api/auth/verifyToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_API_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          console.log('Token is valid, user is admin');
          setIsAdmin(true);
        } else {
          console.log('Token is invalid or user is not admin, signing out');
          logout();
        }
      })
      .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    setShowAnimation(false);
    setShowOrderManager(false);
    setShowQuoteManager(false);
  }, [path]);

  const sendHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.REACT_APP_API_KEY,
  };

  return (
    <AppContext.Provider value={{
        // Utility States
        loading,
        setLoading,
        message,
        setMessage,
        showAnimation,
        setShowAnimation,
        showContact,
        setShowContact,
        showOrderManager,
        setShowOrderManager,
        showQuoteManager,
        setShowQuoteManager,

        // User State
        isAdmin,
        setIsAdmin,

        // Db States
        schools,
        setSchools,
        secretariates,
        setSecretariates,
        schedule,
        setSchedule,
        days,
        setDays,
        events,
        setEvents,
        committees,
        setCommittees,
        categories,
        setCategories,
        quotes,
        setQuotes,
        hotels,
        setHotels,

        // Utility Functions
        sendHeaders,
        logout
    }}>
      {children}
    </AppContext.Provider>
  );
};
