import { useState, useEffect } from 'react';
import { X, Plus, Upload, Trash2, Save, Edit, ArrowLeft, RefreshCcw, MessageSquareQuote} from 'lucide-react';
import { useAppContext } from '../../utils/appContext';
import { usePeople } from '../../utils/usePeople';
import { toast } from 'react-toastify';
import '../../assets/css/adminButtons.css';

const AddSecretariat = () => {
    // Context and Hooks
    const { secretariates, loading, showAnimation, setShowAnimation, setShowOrderManager, setShowQuoteManager } = useAppContext();
    const { createNewSecretariate, updateSecretariate, deleteSecretariate } = usePeople();

    // Local State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        pfp_url: ''
    });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    // Get current selected person
    const selectedPerson = secretariates[selectedPersonIndex] || null;

    // Initialize form data when selected person changes
    useEffect(() => {
        if (!showAddModal && selectedPerson) {
            setFormData({
                name: selectedPerson.name || '',
                title: selectedPerson.title || '',
                description: selectedPerson.description || '',
                pfp_url: selectedPerson.pfp_url || ''
            });
            setPreviewUrl(selectedPerson.pfp_url || '');
        } else if (showAddModal) {
            // Reset form for new secretariat
            setFormData({
                name: '',
                title: '',
                description: '',
                pfp_url: ''
            });
            setPreviewUrl('');
        }
        setFile(null);
    }, [selectedPersonIndex, showAddModal, selectedPerson]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle file selection
    const handleFileChange = (selectedFile) => {
        if (selectedFile) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(selectedFile.type)) {
                toast.error('Please select a valid image file (JPEG, JPG, or PNG)');
                return;
            }
            
            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (selectedFile.size > maxSize) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setFile(selectedFile);
            const fileUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(fileUrl);
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
            handleFileChange(files[0]);
        }
    };

    // Create new secretariat
    const handleCreate = async (e) => {
        e.preventDefault();
        
        const { name, title, description } = formData;
        if (!name || !title || !description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (name.length < 2) {
            toast.error('Name must be at least 2 characters long');
            return;
        }

        if (title.length < 2) {
            toast.error('Title must be at least 2 characters long');
            return;
        }

        if (description.length < 10) {
            toast.error('Biography must be at least 10 characters long');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', name.trim());
            formDataToSend.append('title', title.trim());
            formDataToSend.append('description', description.trim());
            
            if (file) {
                formDataToSend.append('photo', file);
            }
            
            await createNewSecretariate(formDataToSend);
            
            // Reset form and close modal on success
            setShowAddModal(false);
            setFormData({ name: '', title: '', description: '', pfp_url: '' });
            setFile(null);
            setPreviewUrl('');
            toast.success(`${name} has been added to the secretariat successfully!`);
        } catch (error) {
            console.error('Error creating secretariat:', error);
            toast.error('Failed to create secretariat. Please try again.');
        }
    };

    // Update existing secretariat
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!selectedPerson) {
            toast.error('No secretariat member selected');
            return;
        }

        const { name, title, description } = formData;
        if (!name || !title || !description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (name.length < 2) {
            toast.error('Name must be at least 2 characters long');
            return;
        }

        if (title.length < 2) {
            toast.error('Title must be at least 2 characters long');
            return;
        }

        if (description.length < 10) {
            toast.error('Biography must be at least 10 characters long');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', name.trim());
            formDataToSend.append('title', title.trim());
            formDataToSend.append('description', description.trim());
            formDataToSend.append('order_num', selectedPerson.order_num);
            
            if (file) {
                formDataToSend.append('photo', file);
            } else if (formData.pfp_url) {
                formDataToSend.append('pfp', formData.pfp_url);
            }
            
            await updateSecretariate(selectedPerson.id, formDataToSend);
            
            toast.success(`${name} has been updated successfully!`);
        } catch (error) {
            console.error('Error updating secretariat:', error);
            toast.error('Failed to update secretariat. Please try again.');
        }
    };

    // Delete secretariat
    const handleDelete = async () => {
        if (!selectedPerson) {
            toast.error('No secretariat member selected');
            return;
        }
        
        // Use toast for confirmation instead of window.confirm
        const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedPerson.name}? This action cannot be undone.`);
        
        if (confirmDelete) {
            try {
                await deleteSecretariate(selectedPerson.id);
                // Reset selection to first person if current is deleted
                setSelectedPersonIndex(0);
                toast.success(`${selectedPerson.name} has been removed from the secretariat`);
            } catch (error) {
                console.error('Error deleting secretariat:', error);
                toast.error('Failed to delete secretariat member. Please try again.');
            }
        }
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <section className={`admin-panel ${showAnimation ? 'opening' : 'closing'}`}>
            {/* Header Controls */}
            <div className="admin-panel-header">
                <div className="header-title">
                    <Edit size={20} />
                    <h3>Secretariat Manager</h3>
                </div>
                <div className="header-controls">
                    <button
                        className='header-btn'
                        onClick={() => setShowQuoteManager(true)}
                        disabled={loading}
                    >
                        <MessageSquareQuote size={20} />
                    </button>
                    <button
                        className='header-btn'
                        onClick={() => setShowOrderManager(true)}
                        disabled={loading}
                    >
                        <RefreshCcw size={20} />
                    </button>
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
                    ): (
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
                            <h2 className='section-title'>Edit Secretariat Member</h2>
                            <p className="section-subtitle">Update information for existing members</p>
                        </div>
                        
                        {secretariates.length > 0 ? (
                            <div className="person-selector">
                                <label className="selector-label">Select Member to Edit</label>
                                <select
                                    className="person-select"
                                    value={selectedPersonIndex}
                                    onChange={(e) => setSelectedPersonIndex(Number(e.target.value))}
                                >
                                    {secretariates.map((person, index) => (
                                        <option key={person.id || index} value={index}>
                                            {person.name} - {person.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Edit size={48} className="empty-icon" />
                                <h3>No Secretariat Members</h3>
                                <p>Add your first secretariat member to get started</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={20} />
                                    Add First Member
                                </button>
                            </div>
                        )}

                        {secretariates.length > 0 && selectedPerson && (
                            <form onSubmit={handleUpdate} className="secretariat-form">
                                {/* Profile Photo Upload */}
                                <div className="form-section">
                                    <label className="section-label">
                                        <Upload size={16} />
                                        Profile Photo
                                    </label>
                                    <div className="file-upload-area">
                                        <input
                                            id='fileUpload'
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png"
                                            style={{display: 'none'}}
                                            onChange={(e) => handleFileChange(e.target.files[0])}
                                        />
                                        
                                        {previewUrl ? (
                                            <div className="image-preview-container">
                                                <img src={previewUrl} alt="Profile Preview" className="profile-preview" />
                                                <div className="image-overlay">
                                                    <label htmlFor='fileUpload' className='change-photo-btn'>
                                                        <Upload size={16} />
                                                        Change Photo
                                                    </label>
                                                    {file ? (
                                                        <button 
                                                            type="button"
                                                            className='remove-photo-btn'
                                                            onClick={() => {
                                                                setFile(null);
                                                                setPreviewUrl(selectedPerson?.pfp_url || '');
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    ) : (
                                                        // Only show remove button if it's NOT the temporary image
                                                        previewUrl !== 'https://czplyvbxvhcajpshwaos.supabase.co/storage/v1/object/public/secretariate-pfp/temporary_pfp.png' && (
                                                            <button 
                                                                type="button"
                                                                className='remove-photo-btn'
                                                                onClick={() => {
                                                                    setFile(null);
                                                                    setPreviewUrl('https://czplyvbxvhcajpshwaos.supabase.co/storage/v1/object/public/secretariate-pfp/temporary_pfp.png');
                                                                    setFormData(prev => ({ ...prev, pfp_url: '' }));
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor='fileUpload'
                                                className='file-upload-area'
                                                onDragEnter={handleDragEnter}
                                                onDragLeave={handleDragLeave}
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                            >
                                                <Upload size={32} />
                                                <span>
                                                    {isDragOver ? 'Drop image here' : 'Click to upload or drag & drop'}
                                                </span>
                                                <small>JPEG, PNG up to 5MB</small>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="field-label">Full Name *</label>
                                        <input 
                                            type="text"
                                            className="form-input"
                                            placeholder='e.g., John Doe'
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">Position Title *</label>
                                        <input 
                                            type="text"
                                            className="form-input"
                                            placeholder='e.g., Secretary General'
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">Biography *</label>
                                        <textarea 
                                            className="form-textarea"
                                            placeholder='Enter a brief biography and background...'
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={4}
                                            required
                                        />
                                        <small className="char-count">
                                            {formData.description.length} characters
                                        </small>
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
                                        {loading ? 'Deleting...' : 'Delete Member'}
                                    </button>
                                    <button 
                                        type='submit' 
                                        className='btn btn-primary'
                                        disabled={loading}
                                    >
                                        <Save size={16} />
                                        {loading ? 'Updating...' : 'Update Member'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    // Add Mode
                    <div className="add-mode">
                        <div className="mode-header">
                            <h2 className='section-title'>Add New Secretariat Member</h2>
                            <p className="section-subtitle">Create a new member profile</p>
                        </div>
                        
                        <form onSubmit={handleCreate} className="secretariat-form">
                            {/* Profile Photo Upload */}
                            <div className="form-section">
                                <label className="section-label">
                                    <Upload size={16} />
                                    Profile Photo
                                </label>
                                <div className="file-upload-area">
                                    <input
                                        id='fileUploadAdd'
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        style={{display: 'none'}}
                                        onChange={(e) => handleFileChange(e.target.files[0])}
                                    />
                                    
                                    {previewUrl ? (
                                        <div className="image-preview-container">
                                            <img src={previewUrl} alt="Profile Preview" className="profile-preview" />
                                            <div className="image-overlay">
                                                <button 
                                                    type="button"
                                                    className='remove-photo-btn'
                                                    onClick={() => {
                                                        setFile(null);
                                                        setPreviewUrl('');
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor='fileUploadAdd' 
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
                                            <small>JPEG, PNG up to 5MB</small>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="field-label">Full Name *</label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder='e.g., John Doe'
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="field-label">Position Title *</label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder='e.g., Secretary General'
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="field-label">Biography *</label>
                                    <textarea 
                                        className="form-textarea"
                                        placeholder='Enter a brief biography and background...'
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={4}
                                        required
                                    />
                                    <small className="char-count">
                                        {formData.description.length} characters
                                    </small>
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
                                    {loading ? 'Creating...' : 'Create Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AddSecretariat;
