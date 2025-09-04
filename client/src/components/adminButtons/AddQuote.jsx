import { useState, useEffect } from 'react';
import { X, Plus, MessageSquare, Save, ArrowLeft, User, Quote } from 'lucide-react';
import { useAppContext } from '../../utils/appContext';
import { toast } from 'react-toastify';
import '../../assets/css/adminButtons.css';
import { useQuotes } from '../../utils/useQuotes';

const AddQuote = () => {
    // Context and Hooks
    const { secretariates, loading, showAnimation, showQuoteManager, setShowQuoteManager, quotes } = useAppContext();
    const { fetchQuotes, addQuote, updateQuote, deleteQuote } = useQuotes();

    // Local State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        text: '',
        name: '',
        position: '',
        person_id: ''
    });
    const [useSecretariate, setUseSecretariate] = useState(false);

    // Get current selected quote
    const selectedQuote = quotes[selectedQuoteIndex] || null;

    // Fetch quotes on component mount
    useEffect(() => {
        // console.log('Fetching quotes...');
        fetchQuotes();
        // eslint-disable-next-line
    }, []);

    // Initialize form data when selected quote changes
    useEffect(() => {
        if (!showAddModal && selectedQuote) {
            setFormData({
                title: selectedQuote.title || '',
                text: selectedQuote.quote || '',
                name: selectedQuote.name || '',
                position: selectedQuote.position || '',
                person_id: selectedQuote.person_id || ''
            });
            setUseSecretariate(!!selectedQuote.person_id);
        } else if (showAddModal) {
            // Reset form for new quote
            setFormData({
                title: '',
                text: '',
                name: '',
                position: '',
                person_id: ''
            });
            setUseSecretariate(false);
        }
    }, [selectedQuoteIndex, showAddModal, selectedQuote]);

    // Auto-fill form when secretariate is selected
    useEffect(() => {
        if (useSecretariate && formData.person_id) {
            const selectedSecretariate = secretariates.find(s => s.id === formData.person_id);
            if (selectedSecretariate) {
                setFormData(prev => ({
                    ...prev,
                    name: selectedSecretariate.name,
                    position: selectedSecretariate.title,
                    title: `Quote from ${selectedSecretariate.name}`
                }));
            }
        } else if (!useSecretariate) {
            setFormData(prev => ({
                ...prev,
                person_id: ''
            }));
        }
    }, [useSecretariate, formData.person_id, secretariates]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Create new quote
    const handleCreate = async (e) => {
        e.preventDefault();
        
        const { title, text, name, position, person_id } = formData;
        
        if (!text) {
            toast.error('Quote text is required');
            return;
        }

        if (!useSecretariate && (!name || !position)) {
            toast.error('Name and position are required for custom quotes');
            return;
        }

        if (useSecretariate && !person_id) {
            toast.error('Please select a secretariate member');
            return;
        }

        if (text.length < 10) {
            toast.error('Quote text must be at least 10 characters long');
            return;
        }

        try {
            const quoteData = {
                title: title.trim() || (useSecretariate ? `Quote from ${name}` : 'Testimonial'),
                text: text.trim(),
                name: name.trim(),
                position: position.trim(),
                ...(useSecretariate && { person_id })
            };

            await addQuote(quoteData);
        } catch (error) {
            console.error('Error creating quote:', error);
            toast.error('Failed to add quote. Please try again.');
        }
    };

    // Update existing quote
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!selectedQuote) {
            toast.error('No quote selected');
            return;
        }

        const { title, text, name, position, person_id } = formData;
        
        if (!text) {
            toast.error('Quote text is required');
            return;
        }

        if (!useSecretariate && (!name || !position)) {
            toast.error('Name and position are required for custom quotes');
            return;
        }

        if (useSecretariate && !person_id) {
            toast.error('Please select a secretariate member');
            return;
        }

        if (text.length < 10) {
            toast.error('Quote text must be at least 10 characters long');
            return;
        }

        try {
            const quoteData = {
                title: title.trim() || (useSecretariate ? `Quote from ${name}` : 'Testimonial'),
                text: text.trim(),
                name: name.trim(),
                position: position.trim(),
                ...(useSecretariate && { person_id })
            };

            await updateQuote(selectedQuote.id, quoteData);
        } catch (error) {
            console.error('Error updating quote:', error);
            toast.error('Failed to update quote. Please try again.');
        }
    };

    // Delete quote
    const handleDelete = async () => {
        if (!selectedQuote) {
            toast.error('No quote selected');
            return;
        }
        
        const confirmDelete = window.confirm(`Are you sure you want to delete this quote? This action cannot be undone.`);
        
        if (confirmDelete) {
            try {
                await deleteQuote(selectedQuote.id);
            } catch (error) {
                console.error('Error deleting quote:', error);
                toast.error('Failed to delete quote. Please try again.');
            }
        }
    };

    return (
        <section className={`admin-panel ${(showAnimation || showQuoteManager) ? 'opening' : 'closing'}`}>
            {/* Header Controls */}
            <div className="admin-panel-header">
                <div className="header-title">
                    <MessageSquare size={20} />
                    <h3>Quote Manager</h3>
                </div>
                <div className="header-controls">
                    {!showAddModal ? (
                        <button 
                            className='header-btn add-btn' 
                            onClick={() => setShowAddModal(true)} 
                            title="Add New Quote"
                            disabled={loading}
                        >
                            <Plus size={20} />
                        </button>
                    ) : (
                        <button
                            className='header-btn back-btn'
                            onClick={() => setShowAddModal(false)}
                            title="Back"
                            disabled={loading}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <button
                        className='header-btn'
                        onClick={() => setShowQuoteManager(false)}
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-panel-content">
                {!showAddModal ? (
                    // Edit Mode
                    <div className="edit-mode">
                        <div className="mode-header">
                            <h2 className='section-title'>Edit Quote</h2>
                            <p className="section-subtitle">Update existing quotes and testimonials</p>
                        </div>
                        
                        {quotes.length > 0 ? (
                            <div className="person-selector">
                                <label className="selector-label">Select Quote to Edit</label>
                                <select
                                    className="person-select"
                                    value={selectedQuoteIndex}
                                    onChange={(e) => setSelectedQuoteIndex(Number(e.target.value))}
                                >
                                    {quotes.map((quote, index) => (
                                        <option key={quote.id || index} value={index}>
                                            {quote.title} - {quote.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Quote size={48} className="empty-icon" />
                                <h3>No Quotes Yet</h3>
                                <p>Add your first quote or testimonial to get started</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={20} />
                                    Add First Quote
                                </button>
                            </div>
                        )}

                        {quotes.length > 0 && selectedQuote && (
                            <form onSubmit={handleUpdate} className="secretariat-form">
                                {/* Quote Type Selection */}
                                {showAddModal && (
                                <div className="form-section">
                                    <label className="section-label">
                                        <User size={16} />
                                        Quote Type
                                    </label>
                                    <div className="quote-type-selector">
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="quoteType"
                                                checked={!useSecretariate}
                                                onChange={() => setUseSecretariate(false)}
                                            />
                                            <span>Custom Quote</span>
                                        </label>
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="quoteType"
                                                checked={useSecretariate}
                                                onChange={() => setUseSecretariate(true)}
                                            />
                                            <span>From Secretariate</span>
                                        </label>
                                    </div>
                                </div>
                                )}
                                

                                {/* Secretariate Selection */}
                                {useSecretariate && (
                                    <div className="form-section">
                                        <div className="form-group">
                                            <label className="field-label">Select Secretariate Member *</label>
                                            <select
                                                className="form-input"
                                                value={formData.person_id}
                                                onChange={(e) => handleInputChange('person_id', e.target.value)}
                                                required={useSecretariate}
                                            >
                                                <option value="">Choose a member...</option>
                                                {secretariates.map((person) => (
                                                    <option key={person.id} value={person.id}>
                                                        {person.name} - {person.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Form Fields */}
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="field-label">Quote Title</label>
                                        <input 
                                            type="text"
                                            className="form-input"
                                            placeholder='e.g., Amazing Experience'
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                        />
                                        <small className="field-hint">Leave blank for auto-generated title</small>
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">Quote Text *</label>
                                        <textarea 
                                            className="form-textarea"
                                            placeholder='Enter the quote or testimonial text...'
                                            value={formData.text}
                                            onChange={(e) => handleInputChange('text', e.target.value)}
                                            rows={4}
                                            required
                                        />
                                        <small className="char-count">
                                            {formData.text.length} characters
                                        </small>
                                    </div>

                                    {!useSecretariate && (
                                        <>
                                            <div className="form-group">
                                                <label className="field-label">Person Name *</label>
                                                <input 
                                                    type="text"
                                                    className="form-input"
                                                    placeholder='e.g., John Doe'
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    required={!useSecretariate}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="field-label">Person Position *</label>
                                                <input 
                                                    type="text"
                                                    className="form-input"
                                                    placeholder='e.g., Student Delegate'
                                                    value={formData.position}
                                                    onChange={(e) => handleInputChange('position', e.target.value)}
                                                    required={!useSecretariate}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="form-actions">
                                    <button 
                                        type="button"
                                        onClick={handleDelete}
                                        className='btn btn-danger'
                                        disabled={loading}
                                    >
                                        <X size={16} />
                                        {loading ? 'Deleting...' : 'Delete Quote'}
                                    </button>
                                    <button 
                                        type='submit' 
                                        className='btn btn-primary'
                                        disabled={loading}
                                    >
                                        <Save size={16} />
                                        {loading ? 'Updating...' : 'Update Quote'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    // Add Mode
                    <div className="add-mode">
                        <div className="mode-header">
                            <h2 className='section-title'>Add New Quote</h2>
                            <p className="section-subtitle">Create a new quote or testimonial</p>
                        </div>
                        
                        <form onSubmit={handleCreate} className="secretariat-form">
                            {/* Quote Type Selection */}
                            <div className="form-section">
                                <label className="section-label">
                                    <User size={16} />
                                    Quote Type
                                </label>
                                <div className="quote-type-selector">
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            name="quoteType"
                                            checked={!useSecretariate}
                                            onChange={() => setUseSecretariate(false)}
                                        />
                                        <span>Custom Quote</span>
                                    </label>
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            name="quoteType"
                                            checked={useSecretariate}
                                            onChange={() => setUseSecretariate(true)}
                                        />
                                        <span>From Secretariate</span>
                                    </label>
                                </div>
                            </div>

                            {/* Secretariate Selection */}
                            {useSecretariate && (
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="field-label">Select Secretariate Member *</label>
                                        <select
                                            className="form-input"
                                            value={formData.person_id}
                                            onChange={(e) => handleInputChange('person_id', e.target.value)}
                                            required={useSecretariate}
                                        >
                                            <option value="">Choose a member...</option>
                                            {secretariates.map((person) => (
                                                <option key={person.id} value={person.id}>
                                                    {person.name} - {person.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Form Fields */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="field-label">Quote Title</label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder='e.g., Amazing Experience'
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                    />
                                    <small className="field-hint">Leave blank for auto-generated title</small>
                                </div>

                                <div className="form-group">
                                    <label className="field-label">Quote Text *</label>
                                    <textarea 
                                        className="form-textarea"
                                        placeholder='Enter the quote or testimonial text...'
                                        value={formData.text}
                                        onChange={(e) => handleInputChange('text', e.target.value)}
                                        rows={4}
                                        required
                                    />
                                    <small className="char-count">
                                        {formData.text.length} characters
                                    </small>
                                </div>

                                {!useSecretariate && (
                                    <>
                                        <div className="form-group">
                                            <label className="field-label">Person Name *</label>
                                            <input 
                                                type="text"
                                                className="form-input"
                                                placeholder='e.g., John Doe'
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                required={!useSecretariate}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="field-label">Person Position *</label>
                                            <input 
                                                type="text"
                                                className="form-input"
                                                placeholder='e.g., Student Delegate'
                                                value={formData.position}
                                                onChange={(e) => handleInputChange('position', e.target.value)}
                                                required={!useSecretariate}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="form-actions">
                                <button 
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className='btn btn-secondary'
                                    disabled={loading}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button 
                                    type='submit' 
                                    className='btn btn-primary'
                                    disabled={loading}
                                >
                                    <Plus size={16} />
                                    {loading ? 'Creating...' : 'Create Quote'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AddQuote;
