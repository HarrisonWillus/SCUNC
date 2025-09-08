import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppContext } from './appContext';

const useCommittees = () => {
    const { setCommittees, setCategories, setLoading, sendHeaders } = useAppContext();

    // Fetch all committees
    const fetchCommittees = async () => {
        console.log('fetchCommittees start');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/committees`, {
                method: 'GET',
                headers: sendHeaders
            });

            const data = await response.json();
            if (response.ok) {
                setCommittees(data.committees || []);
                console.log('Committees set in context:', data.committees || []);
            } else {
                console.error(data.error || 'Failed to fetch committees');
            }
        } catch (error) {
            console.error('An error occurred while fetching committees');
        } finally {
            console.log('fetchCommittees finish');
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        console.log('fetchCategories start');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/committees/category`, {
                method: 'GET',
                headers: sendHeaders
            });

            const data = await response.json();

            if (response.ok) {
                setCategories(data.categories || []);
                console.log('Categories set in context:');
            } else {
                console.error(data.error || 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('An error occurred while fetching categories');
        } finally {
            console.log('fetchCategories finish');
            setLoading(false);
        }
    }

    // Create a new committee
    const createNewCommittee = async (title, description, category_id, image, background_guide, topics) => {
        console.log('createNewCommittee start');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/committees`, {
                method: 'POST',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ title, description, category_id, image, background_guide, topics })
            });

            const data = await response.json();

            if (response.ok) {
                setCommittees(data.committees);
                toast.success("Committee created successfully!");
                console.log("Committee created successfully:", data.message);
            } else {
                toast.error(data.error || 'Failed to create committee');
                console.error('Committee creation failed:', data.error || 'Unknown error');
            }
        } catch (error) {
            toast.error('An error occurred while creating committee');
            console.error('Committee creation error:', error);  
        } finally {
            console.log('createNewCommittee finish');
            setLoading(false);
        }
    };

    // Update a committee
    const updateCommittee = async (id, title, description, category_id, image, background_guide, order_num, topics) => {
        console.log('updateCommittee start');
        setLoading(true);

        try {
            const requestBody = { 
                name: title, 
                description, 
                category_id, 
                photo: image, 
                committee_letter: background_guide, 
                position_order: order_num,
                topics 
            };

            const response = await fetch(`${process.env.REACT_APP_API_URL}/committees/${id}`, {
                method: 'PUT',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                setCommittees(data.committees);
                toast.success(data.message);
                console.log("Committee updated successfully:", data.message);
            } else {
                toast.error(data.error || 'Failed to update committee');
                console.error('Committee update failed:', data.error || 'Unknown error');
            }
        } catch (error) {
            toast.error('An error occurred while updating committee');
            console.error('Committee update error:', error);
        } finally {
            console.log('updateCommittee finish');
            setLoading(false);
        }
    };

    // Delete a committee
    const deleteCommittee = async (id) => {
        console.log('deleteCommittee start');
        setLoading(true);

        try {
            const requestHeaders = { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` };

            const response = await fetch(`${process.env.REACT_APP_API_URL}/committees/${id}`, {
                method: 'DELETE',
                headers: requestHeaders
            });

            const data = await response.json();

            if (response.ok) {
                setCommittees(data.committees);
                toast.success(data.message);
                console.log("Committee deleted successfully:", data.message);
            } else {
                toast.error(data.error || 'Failed to delete committee');
                console.error('Committee deletion failed:', data.error || 'Unknown error');
            }
        } catch (error) {
            toast.error('An error occurred while deleting committee');
            console.error('Committee deletion error:', error);
        } finally {
            console.log('deleteCommittee finish');
            setLoading(false);
        }
    };

    const createCategory = async (title) => {
        console.log('createCategory start');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/committees/category`, {
                method: 'POST',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ title })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                console.log('Category created successfully:', data.message);
                await fetchCategories(); // Refresh categories
            } else {
                toast.error(data.error || 'Failed to create category');
                console.error('Category creation failed:', data.error || 'Unknown error');
            }
        } catch (error) {
            toast.error('An error occurred while creating category');
            console.error('Category creation error:', error);
        } finally {
            console.log('createCategory finish');
            setLoading(false);
        }
    };

    // Initial fetch when hook is used
    useEffect(() => {
        fetchCommittees();
        fetchCategories();
        // eslint-disable-next-line
    }, []);

    return {
        createNewCommittee,
        updateCommittee,
        deleteCommittee,
        fetchCommittees,
        fetchCategories,
        createCategory
    };
};

export { useCommittees };
