import { useState, useEffect } from 'react';
import { useAppContext } from './appContext';

const useScheduleWorkflow = () => {
    const { loading, setLoading, message, setMessage, days, setDays, events, setEvents, sendHeaders } = useAppContext();
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [error, setError] = useState(null);

    const getAuthHeaders = () => ({
        ...sendHeaders,
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    // =============================================================================
    // SCHEDULE MANAGEMENT (Single Schedule)
    // =============================================================================

    const createOrUpdateSchedule = async (name, releaseDate) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: name.trim(),
                    release_date: releaseDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Schedule saved successfully!' });
                await fetchScheduleDetails();
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to save schedule' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while saving schedule' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateSchedule = async (updates) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Schedule updated successfully!' });
                await fetchScheduleDetails();
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to update schedule' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while updating schedule' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const resetSchedule = async () => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Schedule reset successfully!' });
                await fetchScheduleDetails();
                setDays([]);
                setEvents([]);
                return true;
            } else {
                setMessage({ error: data.error || 'Failed to reset schedule' });
                return false;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while resetting schedule' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const fetchScheduleDetails = async () => {
        console.log('🔍 SCHEDULE_WORKFLOW: Starting fetchScheduleDetails...');
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });
        setError(null);
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/details`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            console.log('📋 SCHEDULE_WORKFLOW: Response status:', response.status);
            const data = await response.json();
            console.log('📋 SCHEDULE_WORKFLOW: Response data:', data);

            if (response.ok) {
                console.log('✅ SCHEDULE_WORKFLOW: Schedule fetched successfully');
                console.log('📅 SCHEDULE_WORKFLOW: Schedule details:', {
                    id: data.id,
                    name: data.name,
                    is_published: data.is_published,
                    days_count: data.days?.length || 0
                });
                
                setCurrentSchedule(data);
                setDays(data.days || []);
                return data;
            } else {
                console.error('❌ SCHEDULE_WORKFLOW: API error:', data);
                return null;
            }
        } catch (error) {
            console.error('💥 SCHEDULE_WORKFLOW: Network/Parse error:', error);
            console.error('💥 SCHEDULE_WORKFLOW: Error stack:', error.stack);
            
            return null;
        } finally {
            setLoading(false);
        }
    };

    // =============================================================================
    // DAY MANAGEMENT (Single Schedule)
    // =============================================================================

    const fetchDays = async () => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Fetched days:', data);
                setDays(data || []);
            } else {
                setMessage({ error: data.error || 'Failed to fetch days' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while fetching days' });
        } finally {
            setLoading(false);
        }
    };

    const createDay = async (date, label) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    date,
                    label: label?.trim()
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Day created successfully!' });
                await fetchDays();
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to create day' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while creating day' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateDay = async (dayId, updates) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Day updated successfully!' });
                await fetchDays();
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to update day' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while updating day' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteDay = async (dayId) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Day deleted successfully!' });
                await fetchDays();
                setEvents([]); // Clear events if we were viewing this day
                return true;
            } else {
                setMessage({ error: data.error || 'Failed to delete day' });
                return false;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while deleting day' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // =============================================================================
    // EVENT MANAGEMENT (Single Schedule)
    // =============================================================================

    const fetchEvents = async (dayId) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}/events`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                setEvents(data || []);
            } else {
                setMessage({ error: data.error || 'Failed to fetch events' });
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while fetching events' });
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async (dayId, eventData) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}/events`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: eventData.title.trim(),
                    start_time: eventData.start_time,
                    end_time: eventData.end_time,
                    location: eventData.location?.trim(),
                    description: eventData.description?.trim(),
                    sort_order: eventData.sort_order || 0
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Event created successfully!' });
                await fetchEvents(dayId);
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to create event' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while creating event' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateEvent = async (eventId, updates) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/events/${eventId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Event updated successfully!' });
                // Refresh events - need to know which day this event belongs to
                const currentEvent = events.find(e => e.id === eventId);
                if (currentEvent) {
                    await fetchEvents(currentEvent.day_id);
                }
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to update event' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while updating event' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async (eventId) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/events/${eventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ success: 'Event deleted successfully!' });
                // Refresh events - need to know which day this event belongs to
                const currentEvent = events.find(e => e.id === eventId);
                if (currentEvent) {
                    await fetchEvents(currentEvent.day_id);
                }
                return true;
            } else {
                setMessage({ error: data.error || 'Failed to delete event' });
                return false;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while deleting event' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const reorderEvents = async (dayId, eventOrders) => {
        setLoading(true);
        setMessage({ error: null, success: null, warning: null });

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}/events/reorder`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ eventOrders })
            });

            const data = await response.json();

            if (response.ok) {
                setEvents(data || []);
                setMessage({ success: 'Events reordered successfully!' });
                return data;
            } else {
                setMessage({ error: data.error || 'Failed to reorder events' });
                return null;
            }
        } catch (error) {
            setMessage({ error: 'An error occurred while reordering events' });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    const publishSchedule = async () => {
        return await updateSchedule({ is_published: true });
    };

    const unpublishSchedule = async () => {
        return await updateSchedule({ is_published: false });
    };

    // Clear messages after a delay
    useEffect(() => {
        if (message.error || message.success || message.warning) {
            const timer = setTimeout(() => {
                setMessage({ error: null, success: null, warning: null });
            }, 5000);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line
    }, [message]);

    // Auto-fetch schedule on mount with error recovery
    useEffect(() => {
        fetchScheduleDetails();
        // eslint-disable-next-line
    }, []);

    return {
        // State
        currentSchedule,
        days,
        events,
        loading,
        message,
        error, // Add error to return values
        
        // Schedule Management (Single Schedule)
        createOrUpdateSchedule,
        updateSchedule,
        resetSchedule,
        fetchScheduleDetails,
        publishSchedule,
        unpublishSchedule,
        
        // Day Management
        fetchDays,
        createDay,
        updateDay,
        deleteDay,
        
        // Event Management
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        reorderEvents,
        
        // Utility
        setCurrentSchedule,
        setMessage,
        setError
    };
};

export { useScheduleWorkflow };
