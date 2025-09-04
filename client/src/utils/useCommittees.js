import { useEffect } from 'react';
import { useAppContext } from './appContext';

const useCommittees = () => {
    const { setCommittees, setCategories, setLoading, setMessage, sendHeaders } = useAppContext();

    // Fetch all committees
    const fetchCommittees = async () => {
        console.log('fetchCommittees start');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch('/api/committees', {
                method: 'GET',
                headers: sendHeaders
            });

            const data = await response.json();
            console.log('Fetched committees data:', data);
            if (response.ok) {
                setCommittees(data.committees || []);
            } else {
                setMessage({ error: data.error || 'Failed to fetch committees' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while fetching committees' });
        } finally {
            console.log('fetchCommittees finish');
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        console.log('fetchCategories start');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch('/api/committees/category', {
                method: 'GET',
                headers: sendHeaders
            });

            const data = await response.json();

            if (response.ok) {
                setCategories(data.categories || []);
            } else {
                setMessage({ error: data.error || 'Failed to fetch categories' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while fetching categories' });
        } finally {
            console.log('fetchCategories finish');
            setLoading(false);
        }
    }

    // Create a new committee
    const createNewCommittee = async (title, description, category_id, image, background_guide, topics) => {
        console.log('createNewCommittee start');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch('/api/committees', {
                method: 'POST',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ title, description, category_id, image, background_guide, topics })
            });

            const data = await response.json();

            if (response.ok) {
                setCommittees(data.committees);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to create committee' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while creating committee' });
        } finally {
            console.log('createNewCommittee finish');
            setLoading(false);
        }
    };

    // Update a committee
    const updateCommittee = async (id, title, description, category_id, image, background_guide, order_num, topics) => {
        console.log('updateCommittee start');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

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

            const response = await fetch(`/api/committees/${id}`, {
                method: 'PUT',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                setCommittees(data.committees);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to update committee' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while updating committee' });
        } finally {
            console.log('updateCommittee finish');
            setLoading(false);
        }
    };

    // Delete a committee
    const deleteCommittee = async (id) => {
        console.log('deleteCommittee start');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const requestHeaders = { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` };

            const response = await fetch(`/api/committees/${id}`, {
                method: 'DELETE',
                headers: requestHeaders
            });

            const data = await response.json();

            if (response.ok) {
                setCommittees(data.committees);
                setMessage({ success: data.message });
            } else {
                setMessage({ error: data.error || 'Failed to delete committee' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while deleting committee' });
        } finally {
            console.log('deleteCommittee finish');
            setLoading(false);
        }
    };

    const createCategory = async (title) => {
        console.log('createCategory start');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch('/api/committees/category', {
                method: 'POST',
                headers: { ...sendHeaders, Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                body: JSON.stringify({ title })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Category created successfully:', data.message);
                setMessage({ success: data.message });
                await fetchCategories(); // Refresh categories
            } else {
                console.log('Category creation failed:', data.error);
                setMessage({ error: data.error || 'Failed to create category' });
            }
        } catch (error) {
            console.log('Category creation error:', error);
            setMessage({ error: 'An error occurred while creating category' });
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
