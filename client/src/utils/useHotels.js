import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppContext } from './appContext';

const useHotels = () => {
    const { setLoading, sendHeaders, setHotels } = useAppContext();

    const getAuthHeaders = () => ({
        ...sendHeaders,
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    // =============================================================================
    // HOTEL MANAGEMENT
    // =============================================================================

    const fetchHotels = async () => {
        console.log('Starting fetchHotels...');
        setLoading(true);

        try {
            console.log('Making API request to fetch hotels');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/hotels`, {
                method: 'GET',
                headers: sendHeaders
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Hotels fetched successfully');
                setHotels(data.hotels || []);
                return data.hotels;
            } else {
                console.error('API error:', data);
                return null;
            }
        } catch (error) {
            console.error('Network/Parse error:', error);
            console.error('Error stack:', error.stack);

            console.log('An error occurred while fetching hotels');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const createHotel = async (hotelData) => {
        console.log('Starting createHotel...');
        console.log('Hotel data:', {
            name: hotelData.name,
            description: hotelData.description ? `${hotelData.description.length} chars` : 'None',
            image: hotelData.image ? 'Provided' : 'None',
            link: hotelData.link || 'None',
            amenities: hotelData.amenities || 'None'
        });
        
        setLoading(true);

        try {
            console.log('Making API request to create hotel');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/hotels`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: hotelData.name,
                    description: hotelData.description,
                    image: hotelData.image,
                    link: hotelData.link,
                    order_num: hotelData.order_num,
                    amenities: hotelData.amenities
                })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Hotel created successfully');
                toast.success('✅ HOTELS_HOOK: Hotel created successfully!');
                setHotels(data.hotels || []);
                return data;
            } else {
                console.error('Create error:', data);
                toast.error('Failed to create hotel');
                return null;
            }
        } catch (error) {
            console.error('Create error:', error);
            toast.error('An error occurred while creating hotel');
            return null;
        } finally {
            console.log('Finished createHotel');
            setLoading(false);
        }
    };

    const updateHotel = async (hotelId, name, description, image, link, extras, extras_title, extras_id) => {
        console.log('Starting updateHotel...');
        console.log('Hotel ID:', hotelId);
        console.log('Updates:', {
            name,
            description,
            image,
            link,
            extras
        });
        
        setLoading(true);

        try {
            console.log('Making API request to update hotel');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/hotels/${hotelId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, description, image, link, extras, extras_title, extras_id })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Hotel updated successfully');
                toast.success('Hotel updated successfully!');
                setHotels(data.hotels || []);
                return data;
            } else {
                console.error('Update error:', data);
                toast.error('Failed to update hotel');
                return null;
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('An error occurred while updating hotel');
            return null;
        } finally {
            console.log('Finished updateHotel');
            setLoading(false);
        }
    };

    const deleteHotel = async (hotelId) => {
        console.log('Starting deleteHotel...');
        console.log('Hotel ID:', hotelId);
        
        setLoading(true);

        try {
            console.log('Making API request to delete hotel');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/hotels/${hotelId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Hotel deleted successfully');
                toast.success('Hotel deleted successfully!');
                setHotels(data.hotels || []);
                return true;
            } else {
                console.error('Delete error:', data);
                toast.error('Failed to delete hotel');
                return false;
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('An error occurred while deleting hotel');
            return false;
        } finally {
            console.log('Finished deleteHotel');
            setLoading(false);
        }
    };

    const getHotelById = async (hotelId) => {
        console.log('Starting getHotelById...');
        console.log('Hotel ID:', hotelId);
        
        setLoading(true);

        try {
            console.log('Making API request to get hotel by ID');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/hotels/${hotelId}`, {
                method: 'GET',
                headers: sendHeaders
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Hotel fetched successfully');
                return data.hotel;
            } else {
                console.error('Get hotel error:', data);
                return null;
            }
        } catch (error) {
            console.error('Get hotel error:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch hotels on mount
    useEffect(() => {
        fetchHotels();
        // eslint-disable-next-line
    }, []);

    return {
        // Hotel Management
        fetchHotels,
        createHotel,
        updateHotel,
        deleteHotel,
        getHotelById,
    };
};

export { useHotels };
