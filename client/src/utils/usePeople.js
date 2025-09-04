import { useAppContext } from "./appContext"

export const usePeople = () => {
    const { setSecretariates, setLoading, setMessage, sendHeaders } = useAppContext();

    const fetchSecretariates = async () => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch('/api/secretariates', {
                method: 'GET',
                headers: sendHeaders,
            });

            const data = await response.json();

            if (response.ok) {
                setSecretariates(data.secretariate);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to fetch secretariates' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while fetching secretariates' });
        } finally {
            setLoading(false);
        }
    };

    const createNewSecretariate = async (name, title, description, pfp) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch('/api/secretariates', {
                method: 'POST',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ name, title, description, pfp })
            });

            const data = await response.json();

            if (response.ok) {
                setSecretariates(data.secretariate);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to create secretariate' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while creating secretariate' });
        } finally {
            setLoading(false);
        }
    };

    const updateSecretariate = async (id, name, title, description, pfp, order_num) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`/api/secretariates/${id}`, {
                method: 'PUT',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ name, title, description, pfp, order_num }) // Send FormData directly
            });

            const data = await response.json();

            if (response.ok) {
                setSecretariates(data.secretariate);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to update secretariate' });
            }
        } catch (error) {
            console.error('Update error:', error);
            setMessage({ error: 'An error occurred while updating secretariate' });
        } finally {
            setLoading(false);
        }
    };

    const deleteSecretariate = async (id) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`/api/secretariates/${id}`, {
                method: 'DELETE',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });

            const data = await response.json();

            if (response.ok) {
                setSecretariates(data.secretariate);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to delete secretariate' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while deleting secretariate' });
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchSecretariates,
        createNewSecretariate,
        updateSecretariate,
        deleteSecretariate
    };
}