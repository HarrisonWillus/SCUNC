import { useAppContext } from "./appContext";

export const useContact = () => {
    const { setLoading, setMessage, sendHeaders } = useAppContext();

    const sendEmail = async (formData ) => {
        console.log('📤 USECONTACT_DEBUG: Starting sendEmail function');
        console.log('📤 USECONTACT_DEBUG: Form data received:', formData);
        console.log('📤 USECONTACT_DEBUG: Form data type:', typeof formData);
        console.log('📤 USECONTACT_DEBUG: Form data keys:', Object.keys(formData));

        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            console.log('🚀 USECONTACT_DEBUG: Making fetch request...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/contact`, {
                method: 'POST',
                headers: { ...sendHeaders },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            setLoading(false);
            if (data.message) {
                console.log('✅ USECONTACT_DEBUG: Success message:', data.message);
                setMessage({ success: data.message });
            } else if (data.error) {
                console.log('❌ USECONTACT_DEBUG: Error message:', data.error);
                setMessage({ error: data.error });
            }
        } catch (error) {
            console.error('💥 USECONTACT_DEBUG: Catch block error:', error);
            console.error('💥 USECONTACT_DEBUG: Error stack:', error.stack);
            setLoading(false);
            setMessage({ error: 'Failed to send email. Please try again.' });
        }
    };

    const sendBusinessEmail = async (formData) => {
        console.log('📤 USECONTACT_DEBUG: Starting sendBusinessEmail function');
        console.log('📤 USECONTACT_DEBUG: Form data received:', formData);
        console.log('📤 USECONTACT_DEBUG: Form data type:', typeof formData);
        console.log('📤 USECONTACT_DEBUG: Form data keys:', Object.keys(formData));
        
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        const requestBody = JSON.stringify(formData);

        try {
            console.log('🚀 USECONTACT_DEBUG: Making business email fetch request...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/contact/business`, {
                method: 'POST',
                headers: { ...sendHeaders },
                body: requestBody
            });

            const data = await response.json();
            
            setLoading(false);
            if (data.message) {
                console.log('✅ USECONTACT_DEBUG: Business success message:', data.message);
                setMessage({ success: data.message });
            } else if (data.error) {
                console.log('❌ USECONTACT_DEBUG: Business error message:', data.error);
                setMessage({ error: data.error });
            }
        } catch (error) {
            console.error('💥 USECONTACT_DEBUG: Business email catch block error:', error);
            console.error('💥 USECONTACT_DEBUG: Business error name:', error.name);
            console.error('💥 USECONTACT_DEBUG: Business error message:', error.message);
            console.error('💥 USECONTACT_DEBUG: Business error stack:', error.stack);
            setLoading(false);
            setMessage({ error: 'Failed to send business email. Please try again.' });
        }
    };

    return { sendEmail, sendBusinessEmail };
}