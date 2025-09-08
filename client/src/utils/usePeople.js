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

    const createNewSecretariate = async (name, title, description, pfp) => {
        console.log('Starting createNewSecretariate...');
        console.log('Secretariate data:', { name, title, description, pfp });
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates`, {
                method: 'POST',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ name, title, description, pfp })
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

    const updateSecretariate = async (id, name, title, description, pfp, order_num) => {
        setLoading(true);
        console.log('Starting updateSecretariate...');
        console.log('Update data:', { id, name, title, description, pfp, order_num });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/secretariates/${id}`, {
                method: 'PUT',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ name, title, description, pfp, order_num }) // Send FormData directly
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
        deleteSecretariate
    };
}