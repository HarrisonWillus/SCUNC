import { useNavigate } from "react-router-dom";
import { useAppContext } from "./appContext"
import { toast } from 'react-toastify';

export const useAuth = () => {
    const { setIsAdmin, setLoading, sendHeaders, logout } = useAppContext();
    const navigate = useNavigate();

    const handleLogin = async (email, password) => {
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
                method: 'POST',
                headers: sendHeaders,
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Login successful! Welcome back.');
                console.log('Login successful:', data);
                sessionStorage.setItem('token', data.token);
                navigate('/admin-dashboard');
                setIsAdmin(true);
            } else {
                toast.error(data.error || 'Invalid email or password. Please try again.');
                console.error('Login failed:', data.error || 'Unknown error');
            }
        } catch (error) {
            toast.error('Network error. Please check your connection and try again.');
            console.error('Login error:', error);
        } finally {
            console.log('handleLogin finish');
            setLoading(false);
        }
    };

    return { handleLogin, logout };
}