import { useAppContext } from "./appContext";
import { toast } from 'react-toastify';

export const useContact = () => {
    const { setLoading, sendHeaders } = useAppContext();

    const sendEmail = async (formData ) => {
        console.log('Starting sendEmail function');
        setLoading(true);

        try {
            console.log('Making fetch request...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/contact`, {
                method: 'POST',
                headers: { ...sendHeaders },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            setLoading(false);
            if (data.message) {
                toast.success(data.message);
                console.log('Success message:', data.message);
            } else if (data.error) {
                toast.error(data.error);
                console.log('Error message:', data.error);
            }
        } catch (error) {
            console.error('Catch block error:', error);
            console.error('Error stack:', error.stack);
            setLoading(false);
            toast.error('Failed to send email. Please try again.');
        }
    };

    const sendBusinessEmail = async (formData) => {
        console.log('Starting sendBusinessEmail function');
        
        setLoading(true);

        const requestBody = JSON.stringify(formData);

        try {
            console.log('Making business email fetch request...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/contact/business`, {
                method: 'POST',
                headers: { ...sendHeaders },
                body: requestBody
            });

            const data = await response.json();
            
            setLoading(false);
            if (data.message) {
                toast.success(data.message);
                console.log('Business success message:', data.message);
            } else if (data.error) {
                toast.error(data.error);
                console.log('Business error message:', data.error);
            }
        } catch (error) {
            console.error('Business email catch block error:', error);
            console.error('Business error name:', error.name);
            console.error('Business error message:', error.message);
            console.error('Business error stack:', error.stack);
            setLoading(false);
            toast.error('Failed to send business email. Please try again.');
        }
    };

    return { sendEmail, sendBusinessEmail };
}