import { useState, useEffect } from 'react';
import { useHotels } from '../../utils/useHotels';
import { useAppContext } from '../../utils/appContext';
import { Plus, X, Upload, Trash2, Save, ArrowLeft, Building2, ExternalLink, List } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../assets/css/adminButtons.css';

const HotelManager = () => {
    // Context and Hooks
    const { createHotel, updateHotel, deleteHotel } = useHotels();
    const { showAnimation, setShowAnimation, hotels, loading } = useAppContext();

    // Local State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedHotelIndex, setSelectedHotelIndex] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        link: '',
    });
    const [amenities, setAmenities] = useState([]);
    const [newAmenity, setNewAmenity] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    // Get current selected hotel
    // eslint-disable-next-line
    const safeHotels = hotels || [];
    const selectedHotel = safeHotels[selectedHotelIndex] || null;

    console.log('🏨 HOTEL_MANAGER: Rendering with hotels:', hotels.length);
    console.log('🏨 HOTEL_MANAGER: Show animation:', showAnimation);

    // Initialize form data when selected hotel changes
    useEffect(() => {
        if (!showAddModal && selectedHotel) {
            setFormData({
                name: selectedHotel.name || '',
                description: selectedHotel.description || '',
                link: selectedHotel.link || '',
            });
            setImagePreviewUrl(selectedHotel.image_url || '');
            // Set amenities from selected hotel
            setAmenities(selectedHotel.amenities ? selectedHotel.amenities.map(a => a.amenity || a) : []);
        } else if (showAddModal) {
            // Reset form for new hotel
            setFormData({
                name: '',
                description: '',
                link: '',
            });
            setImagePreviewUrl('');
            setAmenities([]);
        }
        setImageFile(null);
        setNewAmenity('');
    }, [selectedHotelIndex, showAddModal, selectedHotel, safeHotels]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Amenities management functions
    const addAmenity = () => {
        if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
            setAmenities(prev => [...prev, newAmenity.trim()]);
            setNewAmenity('');
        } else if (amenities.includes(newAmenity.trim())) {
            toast.error('This amenity already exists');
        }
    };

    const removeAmenity = (indexToRemove) => {
        setAmenities(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleAmenityKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addAmenity();
        }
    };

    // Handle image file selection
    const handleImageFileChange = (selectedFile) => {
        if (selectedFile) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(selectedFile.type)) {
                toast.error('Please select a valid image file (JPEG, JPG, PNG, or WebP)');
                return;
            }
            
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (selectedFile.size > maxSize) {
                toast.error('Image file size must be less than 10MB');
                return;
            }

            setImageFile(selectedFile);
            const fileUrl = URL.createObjectURL(selectedFile);
            setImagePreviewUrl(fileUrl);
        }
    };

    // Drag and Drop Handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we're leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageFileChange(files[0]);
        }
    };

    // Create new hotel
    const handleCreate = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.name.length < 3) {
            toast.error('Hotel name must be at least 3 characters long');
            return;
        }

        if (formData.description.length < 20) {
            toast.error('Description must be at least 20 characters long');
            return;
        }

        if (!imageFile) {
            toast.error('Please select an image for the hotel');
            return;
        }

        try {
            const imageData = await fileToBase64(imageFile);
            
            const result = await createHotel({
                name: formData.name.trim(),
                description: formData.description.trim(),
                link: formData.link.trim(),
                image: imageData,
                amenities: amenities
            });
            
            if (result) {
                // Reset form and close modal on success
                setShowAddModal(false);
                setFormData({ name: '', description: '', link: '' });
                setAmenities([]);
                setNewAmenity('');
                setImageFile(null);
                setImagePreviewUrl('');
                toast.success(`${formData.name} hotel has been created successfully!`);
            }
        } catch (error) {
            console.error('Error creating hotel:', error);
            toast.error('Failed to create hotel. Please try again.');
        }
    };

    // Update existing hotel
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!selectedHotel) {
            toast.error('No hotel selected');
            return;
        }

        const { name, description } = formData;
        if (!name || !description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (name.length < 3) {
            toast.error('Hotel name must be at least 3 characters long');
            return;
        }

        if (description.length < 20) {
            toast.error('Description must be at least 20 characters long');
            return;
        }

        try {
            const imageData = imageFile ? await fileToBase64(imageFile) : selectedHotel.image_url;
            
            const result = await updateHotel(selectedHotel.id, {
                name: name.trim(),
                description: description.trim(),
                link: formData.link.trim(),
                image: imageData,
                amenities: amenities
            });
            
            if (result) {
                toast.success(`${name} hotel has been updated successfully!`);
            }
        } catch (error) {
            console.error('Error updating hotel:', error);
            toast.error('Failed to update hotel. Please try again.');
        }
    };

    // Delete hotel
    const handleDelete = async () => {
        if (!selectedHotel) {
            toast.error('No hotel selected');
            return;
        }
        
        const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedHotel.name}" hotel? This action cannot be undone.`);
        
        if (confirmDelete) {
            try {
                const result = await deleteHotel(selectedHotel.id);
                if (result) {
                    // Reset selection to first hotel if current is deleted
                    setSelectedHotelIndex(0);
                    toast.success(`${selectedHotel.name} hotel has been deleted`);
                }
            } catch (error) {
                console.error('Error deleting hotel:', error);
                toast.error('Failed to delete hotel. Please try again.');
            }
        }
    };

    // Utility function to convert file to base64 with filename
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Include the original filename in the data URL
                const result = reader.result;
                // Split the data URL at the comma to separate header from data
                const [header, data] = result.split(',');
                // Insert the filename parameter into the header
                const base64WithFilename = `${header.replace(';base64', `;name=${encodeURIComponent(file.name)};base64`)},${data}`;
                resolve(base64WithFilename);
            };
            reader.onerror = error => reject(error);
        });
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    return (
        <>
        <section className={`admin-panel ${showAnimation ? 'opening' : 'closing'}`}>
            {/* Header Controls */}
            <div className="admin-panel-header">
                <div className="header-title">
                    <Building2 size={20} />
                    <h3>Hotel Manager</h3>
                </div>
                <div className="header-controls">
                    {!showAddModal ? (
                        <>
                            <button
                                className='header-btn add-btn'
                                onClick={() => setShowAddModal(true)}
                                title="Add New"
                                disabled={loading}
                            >
                                <Plus size={20} />
                            </button>
                        </>
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
                        onClick={() => setShowAnimation(false)}
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
                            <h2 className='section-title'>Edit Hotel</h2>
                            <p className="section-subtitle">Update information for existing hotels</p>
                        </div>
                        
                        {safeHotels.length > 0 ? (
                            <div className="person-selector">
                                <label className="selector-label">Select Hotel to Edit</label>
                                <select
                                    className="person-select"
                                    value={selectedHotelIndex}
                                    onChange={(e) => setSelectedHotelIndex(Number(e.target.value))}
                                >
                                    {safeHotels.map((hotel, index) => (
                                        <option key={hotel.id || index} value={index}>
                                            {hotel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Building2 size={48} className="empty-icon" />
                                <h3>No Hotels</h3>
                                <p>Add your first hotel to get started</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={20} />
                                    Add First Hotel
                                </button>
                            </div>
                        )}

                        {safeHotels.length > 0 && selectedHotel && (
                            <form onSubmit={handleUpdate} className="secretariat-form">
                                {/* Hotel Image Upload */}
                                <div className="form-section">
                                    <label className="section-label">
                                        <Upload size={16} />
                                        Hotel Image
                                    </label>
                                    <div className="file-upload-area">
                                        <input
                                            id='imageUpload'
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            style={{display: 'none'}}
                                            onChange={(e) => handleImageFileChange(e.target.files[0])}
                                        />
                                        
                                        {imagePreviewUrl ? (
                                            <div className="image-preview-container">
                                                <img src={imagePreviewUrl} alt="Hotel Preview" className="profile-preview" />
                                                <div className="image-overlay">
                                                    <label htmlFor='imageUpload' className='change-photo-btn'>
                                                        <Upload size={16} />
                                                        Change Image
                                                    </label>
                                                    {imageFile && (
                                                        <button 
                                                            type="button"
                                                            className='remove-photo-btn'
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setImagePreviewUrl(selectedHotel?.image_url || '');
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <label 
                                                htmlFor='imageUpload' 
                                                className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
                                                onDragEnter={handleDragEnter}
                                                onDragLeave={handleDragLeave}
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                            >
                                                <Upload size={32} />
                                                <span>
                                                    {isDragOver ? 'Drop image here' : 'Click to upload or drag & drop'}
                                                </span>
                                                <small>JPEG, PNG, WebP up to 10MB</small>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="field-label">Hotel Name *</label>
                                        <input 
                                            type="text"
                                            className="form-input"
                                            placeholder='e.g., Hilton Garden Inn'
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">Description *</label>
                                        <textarea 
                                            className="form-textarea"
                                            placeholder='Enter hotel description, amenities, and key information...'
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={6}
                                            required
                                        />
                                        <small className="char-count">
                                            {formData.description.length} characters
                                        </small>
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">
                                            <ExternalLink size={16} />
                                            Website Link
                                        </label>
                                        <input 
                                            type="url"
                                            className="form-input"
                                            placeholder='https://hotel-website.com'
                                            value={formData.link}
                                            onChange={(e) => handleInputChange('link', e.target.value)}
                                        />
                                    </div>

                                    {/* Amenities Management */}
                                    <div className="form-group">
                                        <label className="field-label">
                                            <List size={16} />
                                            Hotel Amenities
                                        </label>
                                        <div className="topics-manager">
                                            <div className="topic-input-container">
                                                <input 
                                                    type="text"
                                                    className="form-input topic-input"
                                                    placeholder='Enter an amenity (e.g., Free WiFi, Pool, Gym, Restaurant)'
                                                    value={newAmenity}
                                                    onChange={(e) => setNewAmenity(e.target.value)}
                                                    onKeyDown={handleAmenityKeyPress}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={addAmenity}
                                                    className="btn btn-secondary add-topic-btn"
                                                >
                                                    <Plus size={16} />
                                                    Add
                                                </button>
                                            </div>
                                            
                                            {amenities.length > 0 && (
                                                <div className="topics-list">
                                                    <h4 className="topics-list-title">Current Amenities ({amenities.length})</h4>
                                                    <div className="topics-grid">
                                                        {amenities.map((amenity, index) => (
                                                            <div key={index} className="topic-item">
                                                                <span className="topic-text">{amenity}</span>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => removeAmenity(index)}
                                                                    className="remove-topic-btn"
                                                                    title="Remove amenity"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {amenities.length === 0 && (
                                                <div className="no-topics-message">
                                                    <List size={24} />
                                                    <p>No amenities added yet. Add amenities to help guests understand what the hotel offers.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="form-actions">
                                    <button 
                                        type="button"
                                        onClick={handleDelete}
                                        className='btn btn-danger'
                                        disabled={loading}
                                    >
                                        <Trash2 size={16} />
                                        {loading ? 'Deleting...' : 'Delete Hotel'}
                                    </button>
                                    <button 
                                        type='submit' 
                                        className='btn btn-primary'
                                        disabled={loading}
                                    >
                                        <Save size={16} />
                                        {loading ? 'Updating...' : 'Update Hotel'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    // Add Mode
                    <div className="add-mode">
                        <div className="mode-header">
                            <h2 className='section-title'>Add New Hotel</h2>
                            <p className="section-subtitle">Create a new hotel listing</p>
                        </div>
                        
                        <form onSubmit={handleCreate} className="secretariat-form">
                            {/* Hotel Image Upload */}
                            <div className="form-section">
                                <label className="section-label">
                                    <Upload size={16} />
                                    Hotel Image *
                                </label>
                                <div className="file-upload-area">
                                    <input
                                        id='imageUploadAdd'
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        style={{display: 'none'}}
                                        onChange={(e) => handleImageFileChange(e.target.files[0])}
                                    />
                                    
                                    {imagePreviewUrl ? (
                                        <div className="image-preview-container">
                                            <img src={imagePreviewUrl} alt="Hotel Preview" className="profile-preview" />
                                            <div className="image-overlay">
                                                <button 
                                                    type="button"
                                                    className='remove-photo-btn'
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreviewUrl('');
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor='imageUploadAdd' 
                                            className={`upload-placeholder ${isDragOver ? 'drag-over' : ''}`}
                                            onDragEnter={handleDragEnter}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={handleDrop}
                                        >
                                            <Upload size={32} />
                                            <span>
                                                {isDragOver ? 'Drop image here' : 'Click to upload or drag & drop'}
                                            </span>
                                            <small>JPEG, PNG, WebP up to 10MB</small>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="field-label">Hotel Name *</label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder='e.g., Hilton Garden Inn'
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="field-label">Description *</label>
                                    <textarea 
                                        className="form-textarea"
                                        placeholder='Enter hotel description, amenities, and key information...'
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={6}
                                        required
                                    />
                                    <small className="char-count">
                                        {formData.description.length} characters
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label className="field-label">
                                        <ExternalLink size={16} />
                                        Website Link
                                    </label>
                                    <input 
                                        type="url"
                                        className="form-input"
                                        placeholder='https://hotel-website.com'
                                        value={formData.link}
                                        onChange={(e) => handleInputChange('link', e.target.value)}
                                    />
                                </div>

                                {/* Amenities Management */}
                                <div className="form-group">
                                    <label className="field-label">
                                        <List size={16} />
                                        Hotel Amenities
                                    </label>
                                    <div className="topics-manager">
                                        {/* Input Section */}
                                        <div className="amenity-input-section">
                                            <div className="input-row">
                                                <label className="input-label">Amenity Title *</label>
                                                <input 
                                                    type="text"
                                                    className="form-input"
                                                    placeholder='e.g., Free WiFi, Pool, Fitness Center'
                                                    value={newAmenity}
                                                    onChange={(e) => setNewAmenity(e.target.value)}
                                                    onKeyPress={handleAmenityKeyPress}
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={addAmenity}
                                                className="btn btn-primary add-amenity-btn"
                                                disabled={!newAmenity.trim()}
                                            >
                                                <Plus size={16} />
                                                Add Amenity
                                            </button>
                                        </div>
                                        
                                        {/* Amenities Display */}
                                        {amenities.length > 0 ? (
                                            <div className="amenities-display">
                                                <div className="amenities-header">
                                                    <h4 className="amenities-title">
                                                        <List size={18} />
                                                        Hotel Amenities ({amenities.length})
                                                    </h4>
                                                </div>
                                                <div className="amenities-grid">
                                                    {amenities.map((amenity, index) => (
                                                        <div key={index} className="amenity-card">
                                                            <div className="amenity-content">
                                                                <div className="amenity-title">{amenity}</div>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => removeAmenity(index)}
                                                                className="remove-amenity-btn"
                                                                title="Remove amenity"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="no-amenities-state">
                                                <div className="empty-icon-container">
                                                    <List size={32} />
                                                </div>
                                                <h4>No amenities added yet</h4>
                                                <p>Add amenities to help guests understand what your hotel offers, such as WiFi, pools, restaurants, or fitness facilities.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    {loading ? 'Creating...' : 'Create Hotel'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
    </>
    );
};

export default HotelManager;
