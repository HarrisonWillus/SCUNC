import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppContext } from './appContext';

const useScheduleWorkflow = () => {
    const { setLoading, days, setDays, events, setEvents, sendHeaders } = useAppContext();
    const [currentSchedule, setCurrentSchedule] = useState(null);

    const getAuthHeaders = () => ({
        ...sendHeaders,
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    // =============================================================================
    // SCHEDULE MANAGEMENT (Single Schedule)
    // =============================================================================

    const createOrUpdateSchedule = async (name, releaseDate) => {
        setLoading(true);
        console.log('Creating or updating schedule with name:', name, 'and release date:', releaseDate);
        
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
                console.log('Schedule saved successfully!', data);
                toast.success('Schedule saved successfully!');
                setCurrentSchedule(data);
                await fetchScheduleDetails();
                return data;
            } else {
                console.error('Failed to save schedule:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to save schedule');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while saving schedule:', error);
            toast.error('An error occurred while saving schedule');
            return null;
        } finally {
            console.log('Finished createOrUpdateSchedule');
            setLoading(false);
        }
    };

    const updateSchedule = async (updates) => {
        setLoading(true);
        console.log('Updating schedule with updates:', updates);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Schedule updated successfully!');
                toast.success('Schedule updated successfully!');
                await fetchScheduleDetails();
                return data;
            } else {
                console.error('Failed to update schedule:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to update schedule');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while updating schedule:', error);
            toast.error('An error occurred while updating schedule');
            return null;
        } finally {
            console.log('Finished updateSchedule');
            setLoading(false);
        }
    };

    const resetSchedule = async () => {
        setLoading(true);
        console.log("Resetting schedule...");

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Schedule reset successfully!');
                toast.success('Schedule reset successfully!');
                await fetchScheduleDetails();
                setDays([]);
                setEvents([]);
                return true;
            } else {
                console.error('Failed to reset schedule:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to reset schedule');
                return false;
            }
        } catch (error) {
            console.error('An error occurred while resetting schedule:', error);
            toast.error('An error occurred while resetting schedule');
            return false;
        } finally {
            console.log('Finished resetSchedule');
            setLoading(false);
        }
    };

    const fetchScheduleDetails = async () => {
        console.log('Starting fetchScheduleDetails...');
        setLoading(true);
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/details`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                console.log('Schedule fetched successfully');
                console.log('Schedule details:', {
                    id: data.id,
                    name: data.name,
                    is_published: data.is_published,
                    days_count: data.days?.length || 0
                });
                
                setCurrentSchedule(data);
                setDays(data.days || []);
                return data;
            } else {
                console.error('API error:', data);
                return null;
            }
        } catch (error) {
            console.error('Network/Parse error:', error);
            console.error('Error stack:', error.stack);
            
            return null;
        } finally {
            console.log('Finished fetchScheduleDetails');
            setLoading(false);
        }
    };

    // =============================================================================
    // DAY MANAGEMENT (Single Schedule)
    // =============================================================================

    const fetchDays = async () => {
        setLoading(true);
        console.log('Fetching days...');

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
                console.error('Failed to fetch days:', data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('An error occurred while fetching days:', error);
        } finally {
            console.log('Finished fetching days');
            setLoading(false);
        }
    };

    const createDay = async (date, label) => {
        setLoading(true);
        console.log('Creating day with date:', date, 'and label:', label);

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
                console.log('Day created successfully!');
                toast.success('Day created successfully!');
                await fetchDays();
                return data;
            } else {
                console.error('Failed to create day:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to create day');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while creating day:', error);
            toast.error('An error occurred while creating day');
            return null;
        } finally {
            console.log('Finished creating day');
            setLoading(false);
        }
    };

    const updateDay = async (dayId, updates) => {
        setLoading(true);
        console.log('Updating day with ID:', dayId, 'and updates:', updates);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Day updated successfully!');
                toast.success('Day updated successfully!');
                await fetchDays();
                return data;
            } else {
                console.error('Failed to update day:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to update day');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while updating day:', error);
            toast.error('An error occurred while updating day');
            return null;
        } finally {
            console.log('Finished updating day');
            setLoading(false);
        }
    };

    const deleteDay = async (dayId) => {
        setLoading(true);
        console.log('Deleting day with ID:', dayId);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Day deleted successfully!');
                toast.success('Day deleted successfully!');
                await fetchDays();
                setEvents([]); // Clear events if we were viewing this day
                return true;
            } else {
                console.error('Failed to delete day:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to delete day');
                return false;
            }
        } catch (error) {
            console.error('An error occurred while deleting day:', error);
            toast.error('An error occurred while deleting day');
            return false;
        } finally {
            console.log('Finished deleting day');
            setLoading(false);
        }
    };

    // =============================================================================
    // EVENT MANAGEMENT (Single Schedule)
    // =============================================================================

    const fetchEvents = async (dayId) => {
        setLoading(true);
        console.log('Fetching events for day ID:', dayId);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}/events`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Fetched events:', data);
                setEvents(data || []);
            } else {
                console.error('Failed to fetch events:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to fetch events');
            }
        } catch (error) {
            console.error('An error occurred while fetching events:', error);
            toast.error('An error occurred while fetching events');
        } finally {
            console.log('Finished fetching events');
            setLoading(false);
        }
    };

    const createEvent = async (dayId, eventData) => {
        setLoading(true);
        console.log('Creating event for day ID:', dayId);

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
                console.log('Event created successfully!');
                toast.success('Event created successfully!');
                await fetchEvents(dayId);
                return data;
            } else {
                console.error('Failed to create event:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to create event');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while creating event:', error);
            toast.error('An error occurred while creating event');
            return null;
        } finally {
            console.log('Finished creating event');
            setLoading(false);
        }
    };

    const updateEvent = async (eventId, updates) => {
        setLoading(true);
        console.log('Updating event with ID:', eventId);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/events/${eventId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Event updated successfully!');
                toast.success('Event updated successfully!');
                // Refresh events - need to know which day this event belongs to
                const currentEvent = events.find(e => e.id === eventId);
                if (currentEvent) {
                    await fetchEvents(currentEvent.day_id);
                }
                return data;
            } else {
                console.error('Failed to update event:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to update event');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while updating event:', error);
            toast.error('An error occurred while updating event');
            return null;
        } finally {
            console.log('Finished updating event');
            setLoading(false);
        }
    };

    const deleteEvent = async (eventId) => {
        setLoading(true);
        console.log('Deleting event with ID:', eventId);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/events/${eventId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Event deleted successfully!');
                toast.success('Event deleted successfully!');
                // Refresh events - need to know which day this event belongs to
                const currentEvent = events.find(e => e.id === eventId);
                if (currentEvent) {
                    await fetchEvents(currentEvent.day_id);
                }
                return true;
            } else {
                console.error('Failed to delete event:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to delete event');
                return false;
            }
        } catch (error) {
            console.error('An error occurred while deleting event:', error);
            toast.error('An error occurred while deleting event');
            return false;
        } finally {
            console.log('Finished deleting event');
            setLoading(false);
        }
    };

    const reorderEvents = async (dayId, eventOrders) => {
        setLoading(true);
        console.log('Reordering events for day ID:', dayId);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/schedule/days/${dayId}/events/reorder`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ eventOrders })
            });

            const data = await response.json();

            if (response.ok) {
                setEvents(data || []);
                console.log('Events reordered successfully!');
                toast.success('Events reordered successfully!');
                return data;
            } else {
                console.error('Failed to reorder events:', data.error || 'Unknown error');
                toast.error(data.error || 'Failed to reorder events');
                return null;
            }
        } catch (error) {
            console.error('An error occurred while reordering events:', error);
            toast.error('An error occurred while reordering events');
            return null;
        } finally {
            console.log('Finished reordering events');
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
    };
};

export { useScheduleWorkflow };
