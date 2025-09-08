import { useState, useEffect } from 'react';
import { 
    X, 
    Plus, 
    Calendar, 
    Clock, 
    Save, 
    Edit, 
    ArrowLeft, 
    Trash2, 
    Eye,
    EyeOff,
    Settings,
    MapPin,
    ChevronRight,
} from 'lucide-react';
import { useScheduleWorkflow } from '../../utils/useScheduleWorkflow';
import { useAppContext } from '../../utils/appContext';
import { toast } from 'react-toastify';
import '../../assets/css/scheduleBuilder.css';

const ScheduleBuilder = () => {
    const { showAnimation, setShowAnimation, loading } = useAppContext();
    const {
        currentSchedule,
        days,
        events,
        createOrUpdateSchedule,
        resetSchedule,
        fetchScheduleDetails,
        publishSchedule,
        unpublishSchedule,
        createDay,
        updateDay,
        deleteDay,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        setCurrentSchedule,
        fetchDays
    } = useScheduleWorkflow();

    // Workflow state - simplified for single schedule
    const [workflowStep, setWorkflowStep] = useState('schedule-info'); // 'schedule-info', 'days', 'events', 'preview'
    const [selectedDay, setSelectedDay] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
    const [selectedItem, setSelectedItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        // Schedule form
        name: '',
        release_date: '',
        // Day form
        date: '',
        label: '',
        // Event form
        title: '',
        start_time: '',
        end_time: '',
        location: '',
        description: ''
    });

    // Reset form when switching modes
    useEffect(() => {
        if (!showForm) {
            setFormData({
                name: '',
                release_date: '',
                date: '',
                label: '',
                title: '',
                start_time: '',
                end_time: '',
                location: '',
                description: ''
            });
            setSelectedItem(null);
        }
    }, [showForm]);

    const formatDateForm = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Populate form when editing
    useEffect(() => {
        if (formMode === 'edit' && selectedItem) {
            if (workflowStep === 'schedule-info') {
                setFormData({
                    ...formData,
                    name: selectedItem.name || '',
                    release_date: formatDateForm(selectedItem.release_date)
                });
            } else if (workflowStep === 'days') {
                setFormData({
                    ...formData,
                    date: formatDateForm(selectedItem.date) || '',
                    label: selectedItem.label || ''
                });
            } else if (workflowStep === 'events') {
                setFormData({
                    ...formData,
                    title: selectedItem.title || '',
                    start_time: selectedItem.start_time || '',
                    end_time: selectedItem.end_time || '',
                    location: selectedItem.location || '',
                    description: selectedItem.description || ''
                });
            }
        }
        // eslint-disable-next-line
    }, [formMode, selectedItem, workflowStep]);

    // =============================================================================
    // FORM HANDLERS
    // =============================================================================

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (workflowStep === 'schedule-info') {
            await handleScheduleSubmit();
        } else if (workflowStep === 'days') {
            await handleDaySubmit();
        } else if (workflowStep === 'events') {
            await handleEventSubmit();
        }
    };

    const handleScheduleSubmit = async () => {
        const { name, release_date } = formData;
        
        if (!release_date) {
            toast.error('Release date is required');
            return;
        }

        const result = await createOrUpdateSchedule(name || 'Conference Schedule', release_date);
        if (result) {
            setCurrentSchedule(result);
            setWorkflowStep('days');
            setShowForm(false);
        }
    };

    const handleDaySubmit = async () => {
        const { date, label } = formData;
        
        if (!date) {
            toast.error('Date is required');
            return;
        }

        if (formMode === 'create') {
            const newDay = await createDay(date, label);
            if (newDay) {
                setShowForm(false);
            }
        } else {
            const updated = await updateDay(selectedItem.id, { date, label });
            if (updated) {
                setShowForm(false);
            }
        }
    };

    const handleEventSubmit = async () => {
        const { title, start_time, end_time, location, description } = formData;
        
        if (!title || !start_time || !end_time) {
            toast.error('Title, start time, and end time are required');
            return;
        }

        if (start_time >= end_time) {
            toast.error('End time must be after start time');
            return;
        }

        if (formMode === 'create') {
            const newEvent = await createEvent(selectedDay.id, {
                title,
                start_time,
                end_time,
                location,
                description
            });
            if (newEvent) {
                setShowForm(false);
            }
        } else {
            const updated = await updateEvent(selectedItem.id, {
                title,
                start_time,
                end_time,
                location,
                description
            });
            if (updated) {
                setShowForm(false);
            }
        }
    };

    // =============================================================================
    // ACTION HANDLERS
    // =============================================================================

    const handleEditSchedule = () => {
        setSelectedItem(currentSchedule);
        setWorkflowStep('schedule-info');
        setFormMode('edit');
        setShowForm(true);
    };

    const handleOpenSchedule = async () => {
        if (currentSchedule) {
            await fetchScheduleDetails();
            await fetchDays();
            setWorkflowStep('days');
        }
    };

    const handleResetSchedule = async () => {
        if (window.confirm('Are you sure you want to reset the schedule? This will delete all days and events but keep the schedule structure.')) {
            await resetSchedule();
        }
    };

    const handlePublishToggle = async () => {
        if (currentSchedule?.is_published) {
            await unpublishSchedule();
        } else {
            await publishSchedule();
        }
    };

    const handleOpenDay = async (day) => {
        setSelectedDay(day);
        await fetchEvents(day.id);
        setWorkflowStep('events');
    };

    const handleDeleteDay = async (day) => {
        if (window.confirm(`Are you sure you want to delete this day? This will delete all events for this day.`)) {
            await deleteDay(day.id);
        }
    };

    const handleDeleteEvent = async (event) => {
        if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
            await deleteEvent(event.id);
        }
    };

    const handlePreview = async () => {
        if (currentSchedule) {
            // Fetch complete schedule details with all days and their events
            await fetchScheduleDetails();
            setWorkflowStep('preview');
        }
    };

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    // =============================================================================
    // NAVIGATION HELPERS
    // =============================================================================

    const getBreadcrumb = () => {
        switch (workflowStep) {
            case 'schedule-info':
                return currentSchedule ? `Edit ${currentSchedule?.name}` : 'Setup Schedule';
            case 'days':
                return `${currentSchedule?.name || 'Schedule'} - Day Management`;
            case 'events':
                return `${currentSchedule?.name || 'Schedule'} - ${selectedDay?.label || formatDate(selectedDay?.date)} Events`;
            case 'preview':
                return `${currentSchedule?.name || 'Schedule'} - Preview`;
            default:
                return 'Schedule Builder';
        }
    };

    const canGoBack = () => {
        return workflowStep !== 'schedule-info';
    };

    const handleGoBack = () => {
        if (showForm) {
            setShowForm(false);
            return;
        }

        switch (workflowStep) {
            case 'days':
                setWorkflowStep('schedule-info');
                break;
            case 'events':
                setWorkflowStep('days');
                setSelectedDay(null);
                break;
            case 'preview':
                setWorkflowStep('days');
                break;
            default:
                setWorkflowStep('schedule-info');
        }
    };

    // =============================================================================
    // RENDER COMPONENTS
    // =============================================================================

    const renderScheduleInfo = () => (
        <div className="workflow-content">
            <div className="content-header">
                <div className="header-info">
                    <h2>Schedule Management</h2>
                    <p>Manage your conference schedule</p>
                </div>
                {currentSchedule && (
                    <div className="header-actions">
                        <button 
                            className="btn btn-outline"
                            onClick={handleEditSchedule}
                            disabled={loading}
                        >
                            <Edit size={16} />
                            Edit Info
                        </button>
                        <button 
                            className={`btn ${currentSchedule.is_published ? 'btn-warning' : 'btn-success'}`}
                            onClick={handlePublishToggle}
                            disabled={loading}
                        >
                            {currentSchedule.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                            {currentSchedule.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button 
                            className="btn btn-danger"
                            onClick={handleResetSchedule}
                            disabled={loading}
                        >
                            <Trash2 size={16} />
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {currentSchedule ? (
                <div className="schedule-overview">
                    <div className="schedule-card">
                        <div className="schedule-card-header">
                            <h3>{currentSchedule.name}</h3>
                            <div className="schedule-status">
                                {currentSchedule.is_published ? (
                                    <span className="status-published">
                                        <Eye size={14} />
                                        Published
                                    </span>
                                ) : (
                                    <span className="status-draft">
                                        <EyeOff size={14} />
                                        Draft
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="schedule-card-info">
                            <p><strong>Release Date:</strong> {formatDate(currentSchedule.release_date)}</p>
                            <p><strong>Days:</strong> {days.length || 0}</p>
                            <p><strong>Total Events:</strong> {days.reduce((total, day) => total + (day.event_count || 0), 0)}</p>
                        </div>

                        <div className="schedule-card-actions">
                            <button 
                                className="btn btn-primary"
                                onClick={handleOpenSchedule}
                                disabled={loading}
                            >
                                <Settings size={16} />
                                Manage Days & Events
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <Calendar size={48} className="empty-icon" />
                    <h3>No Schedule Set Up</h3>
                    <p>Create your conference schedule to get started</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setFormMode('create');
                            setShowForm(true);
                        }}
                        disabled={loading}
                    >
                        <Plus size={16} />
                        Create Schedule
                    </button>
                </div>
            )}
        </div>
    );

    const renderScheduleForm = () => (
        <div className="workflow-form">
            <div className="form-header">
                <h2>{currentSchedule ? 'Edit Schedule' : 'Setup Schedule'}</h2>
                <p>Set up basic schedule information</p>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
                <div className="form-group">
                    <label className="field-label">Schedule Name</label>
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g., PITTMUN 2025 Conference"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    <small className="field-help">
                        Optional but helpful for organizing multiple schedules
                    </small>
                </div>

                <div className="form-group">
                    <label className="field-label">Release Date *</label>
                    <input 
                        type="date"
                        className="form-input"
                        value={formData.release_date}
                        onChange={(e) => handleInputChange('release_date', e.target.value)}
                        required
                    />
                    <small className="field-help">
                        When this schedule becomes visible to participants
                    </small>
                </div>

                <div className="form-actions">
                    <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        <Save size={16} />
                        {currentSchedule ? 'Save Changes' : 'Create Schedule'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderDaysManagement = () => (
        <div className="workflow-content">
            <div className="content-header">
                <div className="header-info">
                    <h2>Day Management</h2>
                    <p>Add and organize days for {currentSchedule?.name}</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="btn btn-outline"
                        onClick={handlePreview}
                    >
                        <Eye size={16} />
                        Preview
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            setFormMode('create');
                            setShowForm(true);
                        }}
                        disabled={loading}
                    >
                        <Plus size={16} />
                        Add Day
                    </button>
                </div>
            </div>

            <div className="days-list">
                {days.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} className="empty-icon" />
                        <h3>No Days Added</h3>
                        <p>Start by adding your first conference day</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                setFormMode('create');
                                setShowForm(true);
                            }}
                        >
                            <Plus size={16} />
                            Add First Day
                        </button>
                    </div>
                ) : (
                    days.map(day => (
                        <div key={day.id} className="day-card">
                            <div className="day-card-content">
                                <div className="day-info">
                                    <h3>{day.label || formatDate(day.date)}</h3>
                                    <p className="day-date">{formatDate(day.date)}</p>
                                    <p className="day-stats">{day.event_count || 0} events</p>
                                </div>
                                
                                <div className="day-actions">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => handleOpenDay(day)}
                                    >
                                        <Settings size={14} />
                                        Manage Events
                                        <ChevronRight size={14} />
                                    </button>
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setSelectedItem(day);
                                            setFormMode('edit');
                                            setShowForm(true);
                                            fetchDays(currentSchedule.id);
                                        }}
                                    >
                                        <Edit size={14} />
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteDay(day)}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderDayForm = () => (
        <div className="workflow-form">
            <div className="form-header">
                <h2>{formMode === 'create' ? 'Add New Day' : 'Edit Day'}</h2>
                <p>Set the date and optional label for this day</p>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
                <div className="form-group">
                    <label className="field-label">Date *</label>
                    <input 
                        type="date"
                        className="form-input"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="field-label">Label</label>
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g., Opening Day, Day 1, Committee Sessions"
                        value={formData.label}
                        onChange={(e) => handleInputChange('label', e.target.value)}
                    />
                    <small className="field-help">
                        Optional descriptive label for easier identification
                    </small>
                </div>

                <div className="form-actions">
                    <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        <Save size={16} />
                        {formMode === 'create' ? 'Add Day' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderEventsManagement = () => (
        <div className="workflow-content">
            <div className="content-header">
                <div className="header-info">
                    <h2>Event Management</h2>
                    <p>Manage events for {selectedDay?.label || formatDate(selectedDay?.date)}</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => {
                        setFormMode('create');
                        setShowForm(true);
                    }}
                    disabled={loading}
                >
                    <Plus size={16} />
                    Add Event
                </button>
            </div>

            <div className="events-list">
                {events.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={48} className="empty-icon" />
                        <h3>No Events Added</h3>
                        <p>Start by adding your first event for this day</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                setFormMode('create');
                                setShowForm(true);
                            }}
                        >
                            <Plus size={16} />
                            Add First Event
                        </button>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="event-card">
                            <div className="event-card-content">
                                <div className="event-info">
                                    <h3>{event.title}</h3>
                                    <div className="event-details">
                                        <span className="event-time">
                                            <Clock size={14} />
                                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                        </span>
                                        {event.location && (
                                            <span className="event-location">
                                                <MapPin size={14} />
                                                {event.location}
                                            </span>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p className="event-description">{event.description}</p>
                                    )}
                                </div>
                                
                                <div className="event-actions">
                                    <button 
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setSelectedItem(event);
                                            setFormMode('edit');
                                            setShowForm(true);
                                        }}
                                    >
                                        <Edit size={14} />
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteEvent(event)}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderEventForm = () => (
        <div className="workflow-form">
            <div className="form-header">
                <h2>{formMode === 'create' ? 'Add New Event' : 'Edit Event'}</h2>
                <p>Event details for {selectedDay?.label || formatDate(selectedDay?.date)}</p>
            </div>

            <form onSubmit={handleSubmit} className="schedule-form">
                <div className="form-group">
                    <label className="field-label">Event Title *</label>
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g., Opening Ceremony, Committee Session"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="field-label">Start Time *</label>
                        <input 
                            type="time"
                            className="form-input"
                            value={formData.start_time}
                            onChange={(e) => handleInputChange('start_time', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="field-label">End Time *</label>
                        <input 
                            type="time"
                            className="form-input"
                            value={formData.end_time}
                            onChange={(e) => handleInputChange('end_time', e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="field-label">Location</label>
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g., Main Auditorium, Room 101"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="field-label">Description</label>
                    <textarea 
                        className="form-textarea"
                        placeholder="Optional event description, agenda, or additional details..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="form-actions">
                    <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        <Save size={16} />
                        {formMode === 'create' ? 'Add Event' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderPreview = () => (
        <div className="workflow-content">
            <div className="content-header">
                <div className="header-info">
                    <h2>Schedule Preview</h2>
                    <p>Preview how your schedule will appear to participants</p>
                </div>
                <div className="header-actions">
                    <button 
                        className={`btn ${currentSchedule?.is_published ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handlePublishToggle(currentSchedule)}
                    >
                        {currentSchedule?.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                        {currentSchedule?.is_published ? 'Unpublish' : 'Publish Schedule'}
                    </button>
                </div>
            </div>

            <div className="schedule-preview">
                <div className="preview-header">
                    <h1>{currentSchedule?.name}</h1>
                    <p>Conference Schedule</p>
                </div>

                {days.length === 0 ? (
                    <div className="empty-state">
                        <Calendar size={48} className="empty-icon" />
                        <h3>No Days Scheduled</h3>
                        <p>Add days and events to see the preview</p>
                    </div>
                ) : (
                    <div className="preview-days">
                        {days.map(day => (
                            <div key={day.id} className="preview-day">
                                <div className="preview-day-header">
                                    <h2>{day.label || formatDate(day.date)}</h2>
                                    <p className="preview-day-date">{formatDate(day.date)}</p>
                                </div>
                                
                                {day.events && day.events.length > 0 ? (
                                    <div className="preview-events">
                                        {day.events.map(event => (
                                            <div key={event.id} className="preview-event">
                                                <div className="preview-event-time">
                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                </div>
                                                <div className="preview-event-content">
                                                    <h3>{event.title}</h3>
                                                    {event.location && (
                                                        <p className="preview-event-location">
                                                            <MapPin size={14} />
                                                            {event.location}
                                                        </p>
                                                    )}
                                                    {event.description && (
                                                        <p className="preview-event-description">{event.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="preview-no-events">No events scheduled for this day</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // =============================================================================
    // MAIN RENDER
    // =============================================================================

    return (
        <section className={`schedule-builder ${showAnimation ? 'opening' : 'closing'}`}>
            {/* Header */}
            <div className="builder-header">
                <div className="header-nav">
                    {canGoBack() && (
                        <button 
                            className="btn btn-ghost"
                            onClick={handleGoBack}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    )}
                    <div className="breadcrumb">
                        <h2>{getBreadcrumb()}</h2>
                    </div>
                </div>
                
                <button
                    className='btn btn-ghost'
                    onClick={() => {setShowAnimation(false); fetchScheduleDetails();}}
                >
                    <X size={20} />
                    Close
                </button>
            </div>

            {/* Main Content */}
            <div className="builder-content">
                {showForm ? (
                    workflowStep === 'schedule-info' ? renderScheduleForm() :
                    workflowStep === 'days' ? renderDayForm() :
                    workflowStep === 'events' ? renderEventForm() : null
                ) : (
                    workflowStep === 'schedule-info' ? (currentSchedule && !showForm ? renderScheduleInfo() : renderScheduleForm()) :
                    workflowStep === 'days' ? renderDaysManagement() :
                    workflowStep === 'events' ? renderEventsManagement() :
                    workflowStep === 'preview' ? renderPreview() : null
                )}
            </div>
        </section>
    );
};

export default ScheduleBuilder;
