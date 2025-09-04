import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppContext } from "./appContext";

export const useRegister = () => {
    const { setLoading, setMessage, sendHeaders, setSchools, setIsAdmin } = useAppContext();
    const [status, setStatus] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const fetchSchools = async () => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        await fetch(`${process.env.REACT_APP_API_URL}/schools`, {
            method: 'GET',
            headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        })
        .then(response => response.json())
        .then(data => {
            console.log('Fetched schools data:', data);
            setLoading(false);
            
            // Check if data is an array (successful response) or has an error
            if (!data.message) {
                setSchools(data);
                console.log('Successfully set schools:', data.length, 'schools');
            } else if (data.error) {
                setMessage({ error: data.error });
                setSchools([]);
            } else {
                // Fallback for unexpected response format
                setSchools([]);
                console.warn('Unexpected response format:', data);
            }
        })
        .catch((error) => {
            setLoading(false);
            console.error('Error fetching schools:', error);
            setMessage({ error: 'Failed to fetch schools. Please try again.' });
            setSchools([]);
        })
    };

    const fetchRegistrationStatus = async () => {
        setLoading(true);

        await fetch(`${process.env.REACT_APP_API_URL}/schools/status`, {
            method: 'GET',
            headers: { ...sendHeaders },
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                setLoading(false);
                if (data.isOpen !== undefined) {
                    setStatus(data.isOpen);
                } else if (data.error) {
                    toast.error(data.error);
                }
            })
            .catch(error => {
                setLoading(false);
                toast.error('Failed to fetch registration status. Please try again.');
            });
    }

    const registerSchool = async (formData) => {
        setLoading(true);

        await fetch(`${process.env.REACT_APP_API_URL}/schools/register`, {
            method: 'POST',
            headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
            body: formData // Send FormData directly, don't set Content-Type header
        })
        .then(response => response.json())
        .then(data => {
            setLoading(false);
            if (data.message) {
                toast.success(data.message);
            } else if (data.error) {
                toast.error(data.error);
            }
        })
        .catch(error => {
            setLoading(false);
            toast.error('Registration failed. Please try again.');
        })
    };

    const changeRegistrationStatus = async (newStatus) => {
        setLoading(true);

        await fetch(`${process.env.REACT_APP_API_URL}/schools/status`, {
            method: 'PUT',
            headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json())
        .then(data => {
            setLoading(false);
            if (data.message) {
                setStatus(newStatus); // Update local status state
                toast.success(data.message);
            } else if (data.error) {
                toast.error(data.error);
            }
        })
        .catch(error => {
            setLoading(false);
            toast.error('Failed to change registration status. Please try again.');
        })
    };

    const handleDelete = async (id) => {
        setLoading(true);

        await fetch(`${process.env.REACT_APP_API_URL}/schools/${id}`, {
            method: 'DELETE',
            headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
        })
        .then(response => response.json())
        .then(data => {
            setLoading(false);
            if (data.message) {
                toast.success(data.message);
                fetchSchools(); // Refresh the list after deletion
            } else if (data.error) {
                toast.error(data.error);
            }
        })
        .catch(error => {
            setLoading(false);
            toast.error('Failed to delete school. Please try again.');
        });
    };

    const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

    const verifyAdminAccess = async () => {
        setIsCheckingAuth(true);
        
        try {
        const token = sessionStorage.getItem('token');
        
        if (!token) {
            console.log('No token found');
            setIsAuthenticated(false);
            setIsAdmin(false);
            return;
        }

        // Decode the JWT token
        const decodedToken = decodeJWT(token);
        
        if (!decodedToken) {
            console.log('Invalid token format');
            sessionStorage.removeItem('token');
            setIsAuthenticated(false);
            setIsAdmin(false);
            return;
        }

        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp && decodedToken.exp < currentTime) {
            console.log('Token expired');
            sessionStorage.removeItem('token');
            setIsAuthenticated(false);
            setIsAdmin(false);
            return;
        }

        // Check if user is admin
        if (!decodedToken.isAdmin) {
            console.log('User is not admin');
            setIsAuthenticated(false);
            setIsAdmin(false);
            return;
        }
        setIsAuthenticated(true);
        setIsAdmin(true);
        } catch (error) {
        console.error('Error verifying admin access:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        } finally {
        setIsCheckingAuth(false);
        }
    };

    useEffect(() => {
        fetchSchools();
        verifyAdminAccess();
        // eslint-disable-next-line
    }, []);

    return { fetchSchools, fetchRegistrationStatus, registerSchool, changeRegistrationStatus, status, handleDelete, isAuthenticated, setIsAuthenticated, isCheckingAuth, setIsCheckingAuth };
}