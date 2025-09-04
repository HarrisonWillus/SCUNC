import { useEffect } from 'react';
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
        console.log('🏨 HOTELS_HOOK: Starting fetchHotels...');
        setLoading(true);

        try {
            console.log('📡 HOTELS_HOOK: Making API request to /api/hotels');
            const response = await fetch('/api/hotels', {
                method: 'GET',
                headers: sendHeaders
            });

            console.log('📋 HOTELS_HOOK: Response status:', response.status);
            const data = await response.json();
            console.log('📋 HOTELS_HOOK: Response data:', data);

            if (response.ok) {
                console.log('✅ HOTELS_HOOK: Hotels fetched successfully');
                console.log('🏨 HOTELS_HOOK: Hotels count:', data.hotels?.length || 0);
                
                setHotels(data.hotels || []);
                return data.hotels;
            } else {
                console.error('❌ HOTELS_HOOK: API error:', data);
                return null;
            }
        } catch (error) {
            console.error('💥 HOTELS_HOOK: Network/Parse error:', error);
            console.error('💥 HOTELS_HOOK: Error stack:', error.stack);

            console.log('❌ HOTELS_HOOK: An error occurred while fetching hotels');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const createHotel = async (hotelData) => {
        console.log('🏨 HOTELS_HOOK: Starting createHotel...');
        console.log('📋 HOTELS_HOOK: Hotel data:', {
            name: hotelData.name,
            description: hotelData.description ? `${hotelData.description.length} chars` : 'None',
            image: hotelData.image ? 'Provided' : 'None',
            link: hotelData.link || 'None',
            amenities: hotelData.amenities || 'None'
        });
        
        setLoading(true);

        try {
            console.log('📡 HOTELS_HOOK: Making API request to create hotel');
            const response = await fetch('/api/hotels', {
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

            console.log('📋 HOTELS_HOOK: Response status:', response.status);
            const data = await response.json();
            console.log('📋 HOTELS_HOOK: Response data:', data);

            if (response.ok) {
                console.log('✅ HOTELS_HOOK: Hotel created successfully');
                console.log('✅ HOTELS_HOOK: Hotel created successfully!');
                setHotels(data.hotels || []);
                return data;
            } else {
                console.error('❌ HOTELS_HOOK: Create error:', data);
                console.log('❌ HOTELS_HOOK: Failed to create hotel');
                return null;
            }
        } catch (error) {
            console.error('💥 HOTELS_HOOK: Create error:', error);
            console.log('❌ HOTELS_HOOK: An error occurred while creating hotel');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateHotel = async (hotelId, name, description, image, link, extras, extras_title, extras_id) => {
        console.log('🏨 HOTELS_HOOK: Starting updateHotel...');
        console.log('🆔 HOTELS_HOOK: Hotel ID:', hotelId);
        console.log('📋 HOTELS_HOOK: Updates:', {
            name,
            description,
            image,
            link,
            extras
        });
        
        setLoading(true);

        try {
            console.log('📡 HOTELS_HOOK: Making API request to update hotel');
            const response = await fetch(`/api/hotels/${hotelId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, description, image, link, extras, extras_title, extras_id })
            });

            console.log('📋 HOTELS_HOOK: Response status:', response.status);
            const data = await response.json();
            console.log('📋 HOTELS_HOOK: Response data:', data);

            if (response.ok) {
                console.log('✅ HOTELS_HOOK: Hotel updated successfully');
                console.log('✅ HOTELS_HOOK: Hotel updated successfully!');
                setHotels(data.hotels || []);
                return data;
            } else {
                console.error('❌ HOTELS_HOOK: Update error:', data);
                return null;
            }
        } catch (error) {
            console.error('💥 HOTELS_HOOK: Update error:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteHotel = async (hotelId) => {
        console.log('🏨 HOTELS_HOOK: Starting deleteHotel...');
        console.log('🆔 HOTELS_HOOK: Hotel ID:', hotelId);
        
        setLoading(true);

        try {
            console.log('📡 HOTELS_HOOK: Making API request to delete hotel');
            const response = await fetch(`/api/hotels/${hotelId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            console.log('📋 HOTELS_HOOK: Response status:', response.status);
            const data = await response.json();
            console.log('📋 HOTELS_HOOK: Response data:', data);

            if (response.ok) {
                console.log('✅ HOTELS_HOOK: Hotel deleted successfully');
                console.log('✅ HOTELS_HOOK: Hotel deleted successfully!');
                setHotels(data.hotels || []);
                return true;
            } else {
                console.error('❌ HOTELS_HOOK: Delete error:', data);
                return false;
            }
        } catch (error) {
            console.error('💥 HOTELS_HOOK: Delete error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const getHotelById = async (hotelId) => {
        console.log('🏨 HOTELS_HOOK: Starting getHotelById...');
        console.log('🆔 HOTELS_HOOK: Hotel ID:', hotelId);
        
        setLoading(true);

        try {
            console.log('📡 HOTELS_HOOK: Making API request to get hotel by ID');
            const response = await fetch(`/api/hotels/${hotelId}`, {
                method: 'GET',
                headers: sendHeaders
            });

            console.log('📋 HOTELS_HOOK: Response status:', response.status);
            const data = await response.json();
            console.log('📋 HOTELS_HOOK: Response data:', data);

            if (response.ok) {
                console.log('✅ HOTELS_HOOK: Hotel fetched successfully');
                return data.hotel;
            } else {
                console.error('❌ HOTELS_HOOK: Get hotel error:', data);
                return null;
            }
        } catch (error) {
            console.error('💥 HOTELS_HOOK: Get hotel error:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch hotels on mount
    useEffect(() => {
        console.log('🚀 HOTELS_HOOK: Component mounted, fetching hotels...');
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
