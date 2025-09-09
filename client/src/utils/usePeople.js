import { useAppContext } from "./appContext"
import { toast } from "react-toastify";

export const usePeople = () => {
    const { setSecretariates, setLoading, sendHeaders } = useAppContext();

    const fetchSecretariates = async () => {
        setLoading(true);
        console.log('Fetching secretariates...');

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates`, {
                method: 'GET',
                headers: sendHeaders,
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Secretariates fetched:', data.secretariate);
                setSecretariates(data.secretariate);
            } else {
                console.error('Failed to fetch secretariates:', data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('An error occurred while fetching secretariates:', error);
        } finally {
            console.log('Finished fetching secretariates');
            setLoading(false);
        }
    };

    const createNewSecretariate = async (formData) => {
        console.log('Starting createNewSecretariate...');
        console.log('Secretariate FormData:', formData);
        setLoading(true);

        try {
            // Remove Content-Type header for FormData to let browser set it with boundary
            const headers = { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` };
            delete headers['Content-Type'];

            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates`, {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Secretariate created successfully:', data.secretariate);
                setSecretariates(data.secretariate);
                toast.success('✅ PEOPLE_HOOK: Secretariate created successfully!');
            } else {
                console.error('Failed to create secretariate:', data.error || 'Unknown error');
                toast.error('Failed to create secretariate');
            }
        } catch (error) {
            console.error('An error occurred while creating secretariate:', error);
            toast.error('An error occurred while creating secretariate');
        } finally {
            console.log('Finished createNewSecretariate');
            setLoading(false);
        }
    };

    const updateSecretariatePositions = async (secretariates) => {
        setLoading(true);
        console.log('Starting updateSecretariatePositions...');
        console.log('Secretariates data:', secretariates);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates/positions`, {
                method: 'PUT',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ secretariates })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Secretariate positions updated successfully:', data.secretariate);
                setSecretariates(data.secretariate);
                toast.success('Secretariate positions updated successfully!');
            } else {
                console.error('Failed to update secretariate positions:', data.error || 'Unknown error');
                toast.error('Failed to update secretariate positions');
            }
        } catch (error) {
            console.error('Update positions error:', error);
            toast.error('An error occurred while updating secretariate positions');
        } finally {
            console.log('Finished updateSecretariatePositions');
            setLoading(false);
        }
    };

    const updateSecretariate = async (id, updateData) => {
        setLoading(true);
        console.log('Starting updateSecretariate...');
        console.log('Update data:', { id, updateData });

        try {
            let body;
            let headers = { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` };

            // If updateData is FormData (for full updates with potential file uploads)
            if (updateData instanceof FormData) {
                body = updateData;
                // Don't set Content-Type header, let browser set it with boundary for FormData
                delete headers['Content-Type'];
            } else {
                // For simple updates (like order_num only), send as JSON
                body = JSON.stringify(updateData);
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates/${id}`, {
                method: 'PUT',
                headers,
                body
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Secretariate updated successfully:', data.secretariate);
                setSecretariates(data.secretariate);
                toast.success('Secretariate updated successfully!');
            } else {
                console.error('Failed to update secretariate:', data.error || 'Unknown error');
                toast.error('Failed to update secretariate');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('An error occurred while updating secretariate');
        } finally {
            console.log('Finished updateSecretariate');
            setLoading(false);
        }
    };

    const deleteSecretariate = async (id) => {
        setLoading(true);
        console.log('Starting deleteSecretariate...');
        console.log('Deleting secretariate with ID:', id);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates/${id}`, {
                method: 'DELETE',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Secretariate deleted successfully:', data.secretariate);
                setSecretariates(data.secretariate);
                toast.success(data.message || 'Secretariate deleted successfully!');
            } else {
                console.error('Failed to delete secretariate:', data.error || 'Unknown error');
                toast.error('Failed to delete secretariate');
            }
        } catch (error) {
            console.error('An error occurred while deleting secretariate:', error);
            toast.error('An error occurred while deleting secretariate');
        } finally {
            console.log('Finished deleteSecretariate');
            setLoading(false);
        }
    };

    return {
        fetchSecretariates,
        createNewSecretariate,
        updateSecretariate,
        updateSecretariatePositions,
        deleteSecretariate
    };
}