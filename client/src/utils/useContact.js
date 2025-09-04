import { useAppContext } from "./appContext";

export const useContact = () => {
    const { setLoading, setMessage, sendHeaders } = useAppContext();

    const sendEmail = async (name, email, subject, message ) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        await fetch('/api/contact', {
            method: 'POST',
            headers: { ...sendHeaders },
            body: JSON.stringify({ name, email, subject, message })
        })
        .then(response => response.json())
        .then(data => {
            setLoading(false);
            if (data.message) {
                setMessage({ success: data.message });
            } else if (data.error) {
                setMessage({ error: data.error });
            }
        })
        .catch(error => {
            setLoading(false);
            setMessage({ error: 'Failed to send email. Please try again.' });
        })
    };

    const sendBusinessEmail = async (name, email, subject, message, organization, referral) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        await fetch('/api/contact/business', {
            method: 'POST',
            headers: { ...sendHeaders },
            body: JSON.stringify({ name, email, subject, message, organization, referral })
        })
        .then(response => response.json())
        .then(data => {
            setLoading(false);
            if (data.message) {
                setMessage({ success: data.message });
            } else if (data.error) {
                setMessage({ error: data.error });
            }
        })
        .catch(error => {
            setLoading(false);
            setMessage({ error: 'Failed to send business email. Please try again.' });
        })
    };

    return { sendEmail, sendBusinessEmail };
}