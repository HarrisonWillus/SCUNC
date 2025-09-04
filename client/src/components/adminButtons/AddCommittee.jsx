import { useState, useEffect } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Upload, Trash2, Save, Edit, ArrowLeft, FileText, FolderPlus, List } from 'lucide-react';
import { useAppContext } from '../../utils/appContext';
import { useCommittees } from '../../utils/useCommittees';
import { toast } from 'react-toastify';
import '../../assets/css/adminButtons.css';

const AddCommittee = () => {
    // Context and Hooks
    const { committees, categories, loading, showAnimation, setShowAnimation } = useAppContext();
    const { createNewCommittee, updateCommittee, deleteCommittee, createCategory, fetchCategories } = useCommittees();

    // Local State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCommitteeIndex, setSelectedCommitteeIndex] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        image_url: '',
        background_guide_url: ''
    });
    const [topics, setTopics] = useState([]);
    const [newTopic, setNewTopic] = useState('');
    const [categoryFormData, setCategoryFormData] = useState({
        title: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragType, setDragType] = useState(''); // 'image' or 'pdf'

    // Get current selected committee
    const safeCommittees = committees || [];
    const selectedCommittee = safeCommittees[selectedCommitteeIndex] || null;

    // Initialize form data when selected committee changes
    useEffect(() => {
        if (!showAddModal && selectedCommittee) {
            setFormData({
                title: selectedCommittee.title || '',
                description: selectedCommittee.description || '',
                category: selectedCommittee.category_id || '',
                image_url: selectedCommittee.image_url || '',
                background_guide_url: selectedCommittee.background_guide_url || ''
            });
            setImagePreviewUrl(selectedCommittee.image_url || '');
            // Set topics from selected committee
            setTopics(selectedCommittee.topics ? selectedCommittee.topics.map(t => t.topic || t) : []);
        } else if (showAddModal) {
            // Reset form for new committee
            setFormData({
                title: '',
                description: '',
                category: '',
                image_url: '',
                background_guide_url: ''
            });
            setImagePreviewUrl('');
            setTopics([]);
        }
        setImageFile(null);
        setPdfFile(null);
        setNewTopic('');
    }, [selectedCommitteeIndex, showAddModal, selectedCommittee]);

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Topics management functions
    const addTopic = () => {
        if (newTopic.trim() && !topics.includes(newTopic.trim())) {
            setTopics(prev => [...prev, newTopic.trim()]);
            setNewTopic('');
        } else if (topics.includes(newTopic.trim())) {
            toast.error('This topic already exists');
        }
    };

    const removeTopic = (indexToRemove) => {
        setTopics(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleTopicKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic();
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

    // Handle PDF file selection
    const handlePdfFileChange = (selectedFile) => {
        if (selectedFile) {
            // Validate file type
            if (selectedFile.type !== 'application/pdf') {
                toast.error('Please select a valid PDF file');
                return;
            }
            
            // Validate file size (50MB max)
            const maxSize = 50 * 1024 * 1024; // 50MB in bytes
            if (selectedFile.size > maxSize) {
                toast.error('PDF file size must be less than 50MB');
                return;
            }

            setPdfFile(selectedFile);
            toast.success(`Background guide "${selectedFile.name}" selected`);
        }
    };

    // Drag and Drop Handlers
    const handleDragEnter = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
        setDragType(type);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we're leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
            setDragType('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        setDragType('');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            if (type === 'image') {
                handleImageFileChange(files[0]);
            } else if (type === 'pdf') {
                handlePdfFileChange(files[0]);
            }
        }
    };

    // Create new committee
    const handleCreate = async (e) => {
        e.preventDefault();
        
        const { title, description, category } = formData;
        if (!title || !description || !category) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (title.length < 3) {
            toast.error('Committee title must be at least 3 characters long');
            return;
        }

        if (description.length < 20) {
            toast.error('Description must be at least 20 characters long');
            return;
        }

        try {
            const imageData = imageFile ? await fileToBase64(imageFile) : null;
            const pdfData = pdfFile ? await fileToBase64(pdfFile) : null;

            console.log('sending these: ', {
                title: title.trim(),
                description: description.trim(),
                category_id: category,
                image: imageData,
                background_guide: pdfData,
                topics: topics
            });
            
            await createNewCommittee(
                title.trim(), 
                description.trim(), 
                category, 
                imageData,
                pdfData,
                topics
            );
            
            // Reset form and close modal on success
            setShowAddModal(false);
            setFormData({ title: '', description: '', category: '', image_url: '', background_guide_url: '' });
            setTopics([]);
            setNewTopic('');
            setImageFile(null);
            setPdfFile(null);
            setImagePreviewUrl('');
            toast.success(`${title} committee has been created successfully!`);
        } catch (error) {
            console.error('Error creating committee:', error);
            toast.error('Failed to create committee. Please try again.');
        }
    };

    // Update existing committee
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!selectedCommittee) {
            toast.error('No committee selected');
            return;
        }

        const { title, description, category } = formData;
        if (!title || !description || !category) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (title.length < 3) {
            toast.error('Committee title must be at least 3 characters long');
            return;
        }

        if (description.length < 20) {
            toast.error('Description must be at least 20 characters long');
            return;
        }

        try {
            const imageData = imageFile ? await fileToBase64(imageFile) : formData.image_url;
            const pdfData = pdfFile ? await fileToBase64(pdfFile) : formData.background_guide_url;
            
            console.log('sending these: ', {
                title: title.trim(),
                description: description.trim(),
                category_id: category,
                image: imageData ? 'there' : 'not there',
                background_guide: pdfData ? 'there' : 'not there',
                topics: topics
            });

            await updateCommittee(
                selectedCommittee.id,
                title.trim(),
                description.trim(),
                formData.category,
                imageData,
                pdfData,
                selectedCommittee.order_num,
                topics
            );
            
            toast.success(`${title} committee has been updated successfully!`);
        } catch (error) {
            console.error('Error updating committee:', error);
            toast.error('Failed to update committee. Please try again.');
        }
    };

    // Delete committee
    const handleDelete = async () => {
        if (!selectedCommittee) {
            toast.error('No committee selected');
            return;
        }
        
        const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedCommittee.title}" committee? This action cannot be undone.`);
        
        if (confirmDelete) {
            try {
                await deleteCommittee(selectedCommittee.id);
                // Reset selection to first committee if current is deleted
                setSelectedCommitteeIndex(0);
                toast.success(`${selectedCommittee.title} committee has been deleted`);
            } catch (error) {
                console.error('Error deleting committee:', error);
                toast.error('Failed to delete committee. Please try again.');
            }
        }
    };

    // Handle reordering
    const handleReorder = async (direction) => {
        if (!selectedCommittee) {
            toast.error('No committee selected');
            return;
        }
        
        const currentOrder = selectedCommittee.order_num || 0;
        const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
        
        try {
            await updateCommittee(
                selectedCommittee.id,
                selectedCommittee.title,
                selectedCommittee.description,
                selectedCommittee.category_id,
                selectedCommittee.image_url,
                selectedCommittee.background_guide_url,
                selectedCommittee.background_guide_name,
                newOrder
            );
            toast.success(`${selectedCommittee.title} moved ${direction} in the order`);
        } catch (error) {
            console.error('Error reordering committee:', error);
            toast.error('Failed to reorder committee. Please try again.');
        }
    };

    // Handle category creation
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        
        const { title } = categoryFormData;
        if (!title || title.trim().length < 2) {
            toast.error('Category title must be at least 2 characters long');
            return;
        }

        // Check if category already exists
        const safeCategories = categories || [];
        if (safeCategories.some(cat => cat.title && cat.title.toLowerCase() === title.trim().toLowerCase())) {
            toast.error('Category already exists');
            return;
        }

        try {
            await createCategory(title.trim());
            
            // Add a small delay to ensure the backend has processed the category creation
            setTimeout(async () => {
                await fetchCategories(); // Refresh categories to get the new one with ID
                
                // Find the newly created category and set it as selected
                const updatedCategories = categories || [];
                const newCategory = updatedCategories.find(cat => 
                    cat.title && cat.title.toLowerCase() === title.trim().toLowerCase()
                );
                
                if (newCategory) {
                    setFormData(prev => ({ ...prev, category: newCategory.id }));
                    console.log('New category selected:', newCategory);
                } else {
                    console.log('Could not find newly created category');
                }
            }, 500); // 500ms delay
            
            setCategoryFormData({ title: '' });
            setShowCategoryModal(false);
            toast.success(`Category "${title}" created and selected successfully!`);
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Failed to create category. Please try again.');
        }
    };

    // Handle category input change
    const handleCategoryInputChange = (field, value) => {
        setCategoryFormData(prev => ({ ...prev, [field]: value }));
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
                    <Edit size={20} />
                    <h3>Committee Manager</h3>
                </div>
                <div className="header-controls">
                    {!showAddModal ? (
                        <>
                            {safeCommittees.length > 0 && (
                                <>
                                    <button 
                                        className='header-btn reorder-btn' 
                                        onClick={() => handleReorder('up')} 
                                        title="Move Up"
                                        disabled={loading}
                                    >
                                        <ChevronUp size={20} />
                                    </button>
                                    <button 
                                        className='header-btn reorder-btn' 
                                        onClick={() => handleReorder('down')} 
                                        title="Move Down"
                                        disabled={loading}
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </>
                            )}
                            
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
                            <h2 className='section-title'>Edit Committee</h2>
                            <p className="section-subtitle">Update information for existing committees</p>
                        </div>
                        
                        {safeCommittees.length > 0 ? (
                            <div className="person-selector">
                                <label className="selector-label">Select Committee to Edit</label>
                                <select
                                    className="person-select"
                                    value={selectedCommitteeIndex}
                                    onChange={(e) => setSelectedCommitteeIndex(Number(e.target.value))}
                                >
                                    {safeCommittees.map((committee, index) => (
                                        <option key={committee.id || index} value={index}>
                                            {committee.title} - {committee.category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Edit size={48} className="empty-icon" />
                                <h3>No Committees</h3>
                                <p>Add your first committee to get started</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={20} />
                                    Add First Committee
                                </button>
                            </div>
                        )}

                        {safeCommittees.length > 0 && selectedCommittee && (
                            <form onSubmit={handleUpdate} className="secretariat-form">
                                {/* Committee Image Upload */}
                                <div className="form-section">
                                    <label className="section-label">
                                        <Upload size={16} />
                                        Committee Image
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
                                                <img src={imagePreviewUrl} alt="Committee Preview" className="profile-preview" />
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
                                                                setImagePreviewUrl(selectedCommittee?.image_url || '');
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
                                                className={`file-upload-area ${isDragOver && dragType === 'image' ? 'drag-over' : ''}`}
                                                onDragEnter={(e) => handleDragEnter(e, 'image')}
                                                onDragLeave={handleDragLeave}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, 'image')}
                                            >
                                                <Upload size={32} />
                                                <span>
                                                    {isDragOver && dragType === 'image' ? 'Drop image here' : 'Click to upload or drag & drop'}
                                                </span>
                                                <small>JPEG, PNG, WebP up to 10MB</small>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* PDF Upload */}
                                <div className="form-section">
                                    <label className="section-label">
                                        <FileText size={16} />
                                        Background Guide (PDF)
                                    </label>
                                    <div className="file-upload-area">
                                        <input
                                            id='pdfUpload'
                                            type="file"
                                            accept="application/pdf"
                                            style={{display: 'none'}}
                                            onChange={(e) => handlePdfFileChange(e.target.files[0])}
                                        />
                                        
                                        <label 
                                            htmlFor='pdfUpload' 
                                            className={`pdf-upload-area ${isDragOver && dragType === 'pdf' ? 'drag-over' : ''}`}
                                            onDragEnter={(e) => handleDragEnter(e, 'pdf')}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, 'pdf')}
                                        >
                                            <FileText size={32} />
                                            <span>
                                                {pdfFile ? `Selected: ${pdfFile.name}` : 
                                                 selectedCommittee?.background_guide_name ? `Current: ${selectedCommittee.background_guide_name}` :
                                                 isDragOver && dragType === 'pdf' ? 'Drop PDF here' : 'Click to upload PDF or drag & drop'}
                                            </span>
                                            <small>PDF files up to 50MB</small>
                                        </label>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="form-section">
                                    <div className="form-group">
                                        <label className="field-label">Committee Title *</label>
                                        <input 
                                            type="text"
                                            className="form-input"
                                            placeholder='e.g., United Nations Security Council'
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">Category *</label>
                                        <select 
                                            className="form-input"
                                            value={formData.category}
                                            onChange={(e) => {
                                                if (e.target.value === 'ADD_NEW_CATEGORY') {
                                                    setShowCategoryModal(true);
                                                } else {
                                                    handleInputChange('category', e.target.value);
                                                }
                                            }}
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(category => (
                                                <option key={category.id || category.title} value={category.id}>
                                                    {category.title || category}
                                                </option>
                                            ))}
                                            <option value="ADD_NEW_CATEGORY" style={{ fontStyle: 'italic', backgroundColor: '#f0f9ff' }}>
                                                + Add New Category
                                            </option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="field-label">Description *</label>
                                        <textarea 
                                            className="form-textarea"
                                            placeholder='Enter committee description, mandate, and key information...'
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={6}
                                            required
                                        />
                                        <small className="char-count">
                                            {formData.description.length} characters
                                        </small>
                                    </div>

                                    {/* Topics Management */}
                                    <div className="form-group">
                                        <label className="field-label">
                                            <List size={16} />
                                            Committee Topics
                                        </label>
                                        <div className="topics-manager">
                                            <div className="topic-input-container">
                                                <input 
                                                    type="text"
                                                    className="form-input topic-input"
                                                    placeholder='Enter a topic (e.g., International Security, Climate Change)'
                                                    value={newTopic}
                                                    onChange={(e) => setNewTopic(e.target.value)}
                                                    onKeyDown={handleTopicKeyPress}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={addTopic}
                                                    className="btn btn-secondary add-topic-btn"
                                                >
                                                    <Plus size={16} />
                                                    Add
                                                </button>
                                            </div>
                                            
                                            {topics.length > 0 && (
                                                <div className="topics-list">
                                                    <h4 className="topics-list-title">Current Topics ({topics.length})</h4>
                                                    <div className="topics-grid">
                                                        {topics.map((topic, index) => (
                                                            <div key={index} className="topic-item">
                                                                <span className="topic-text">{topic}</span>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => removeTopic(index)}
                                                                    className="remove-topic-btn"
                                                                    title="Remove topic"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {topics.length === 0 && (
                                                <div className="no-topics-message">
                                                    <List size={24} />
                                                    <p>No topics added yet. Add topics to help delegates understand what will be discussed.</p>
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
                                        {loading ? 'Deleting...' : 'Delete Committee'}
                                    </button>
                                    <button 
                                        type='submit' 
                                        className='btn btn-primary'
                                        disabled={loading}
                                    >
                                        <Save size={16} />
                                        {loading ? 'Updating...' : 'Update Committee'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    // Add Mode
                    <div className="add-mode">
                        <div className="mode-header">
                            <h2 className='section-title'>Add New Committee</h2>
                            <p className="section-subtitle">Create a new committee profile</p>
                        </div>
                        
                        <form onSubmit={handleCreate} className="secretariat-form">
                            {/* Committee Image Upload */}
                            <div className="form-section">
                                <label className="section-label">
                                    <Upload size={16} />
                                    Committee Image
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
                                            <img src={imagePreviewUrl} alt="Committee Preview" className="profile-preview" />
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
                                            className={`upload-placeholder ${isDragOver && dragType === 'image' ? 'drag-over' : ''}`}
                                            onDragEnter={(e) => handleDragEnter(e, 'image')}
                                            onDragLeave={handleDragLeave}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, 'image')}
                                        >
                                            <Upload size={32} />
                                            <span>
                                                {isDragOver && dragType === 'image' ? 'Drop image here' : 'Click to upload or drag & drop'}
                                            </span>
                                            <small>JPEG, PNG, WebP up to 10MB</small>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* PDF Upload */}
                            <div className="form-section">
                                <label className="section-label">
                                    <FileText size={16} />
                                    Background Guide (PDF)
                                </label>
                                <div className="file-upload-area">
                                    <input
                                        id='pdfUploadAdd'
                                        type="file"
                                        accept="application/pdf"
                                        style={{display: 'none'}}
                                        onChange={(e) => handlePdfFileChange(e.target.files[0])}
                                    />
                                    
                                    <label 
                                        htmlFor='pdfUploadAdd' 
                                        className={`pdf-upload-area ${isDragOver && dragType === 'pdf' ? 'drag-over' : ''}`}
                                        onDragEnter={(e) => handleDragEnter(e, 'pdf')}
                                        onDragLeave={handleDragLeave}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, 'pdf')}
                                    >
                                        <FileText size={32} />
                                        <span>
                                            {pdfFile ? `Selected: ${pdfFile.name}` : 
                                             isDragOver && dragType === 'pdf' ? 'Drop PDF here' : 'Click to upload PDF or drag & drop'}
                                        </span>
                                        <small>PDF files up to 50MB</small>
                                    </label>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label className="field-label">Committee Title *</label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder='e.g., United Nations Security Council'
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="field-label">Category *</label>
                                    <select 
                                        className="form-input"
                                        value={formData.category}
                                        onChange={(e) => {
                                            if (e.target.value === 'ADD_NEW_CATEGORY') {
                                                setShowCategoryModal(true);
                                            } else {
                                                handleInputChange('category', e.target.value);
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(category => (
                                            <option key={category.id || category.title} value={category.id || category.title}>
                                                {category.title || category}
                                            </option>
                                        ))}
                                        <option value="ADD_NEW_CATEGORY" style={{ fontStyle: 'italic', backgroundColor: '#f0f9ff' }}>
                                            + Add New Category
                                        </option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="field-label">Description *</label>
                                    <textarea 
                                        className="form-textarea"
                                        placeholder='Enter committee description, mandate, and key information...'
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={6}
                                        required
                                    />
                                    <small className="char-count">
                                        {formData.description.length} characters
                                    </small>
                                </div>

                                {/* Topics Management */}
                                <div className="form-group">
                                    <label className="field-label">
                                        <List size={16} />
                                        Committee Topics
                                    </label>
                                    <div className="topics-manager">
                                        <div className="topic-input-container">
                                            <input 
                                                type="text"
                                                className="form-input topic-input"
                                                placeholder='Enter a topic (e.g., International Security, Climate Change)'
                                                value={newTopic}
                                                onChange={(e) => setNewTopic(e.target.value)}
                                                onKeyPress={handleTopicKeyPress}
                                            />
                                            <button 
                                                type="button"
                                                onClick={addTopic}
                                                className="btn btn-secondary add-topic-btn"
                                                disabled={!newTopic.trim()}
                                            >
                                                <Plus size={16} />
                                                Add
                                            </button>
                                        </div>
                                        
                                        {topics.length > 0 && (
                                            <div className="topics-list">
                                                <h4 className="topics-list-title">Current Topics ({topics.length})</h4>
                                                <div className="topics-grid">
                                                    {topics.map((topic, index) => (
                                                        <div key={index} className="topic-item">
                                                            <span className="topic-text">{topic}</span>
                                                            <button 
                                                                type="button"
                                                                onClick={() => removeTopic(index)}
                                                                className="remove-topic-btn"
                                                                title="Remove topic"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {topics.length === 0 && (
                                            <div className="no-topics-message">
                                                <List size={24} />
                                                <p>No topics added yet. Add topics to help delegates understand what will be discussed.</p>
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
                                    {loading ? 'Creating...' : 'Create Committee'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
        
        {/* Category Creation Modal */}
        {showCategoryModal && (
            <div className="admin-overlay">
                <div className="admin-modal category-modal">
                    <div className="admin-header">
                        <h2>
                            <FolderPlus size={20} style={{marginRight: '0.5rem'}} />
                            Add New Category
                        </h2>
                        <button 
                            className="close-button"
                            onClick={() => {
                                setShowCategoryModal(false);
                                setCategoryFormData({ title: '' });
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="admin-content">
                        <form onSubmit={handleCreateCategory} className="category-form">
                            <div className="form-group">
                                <label className="field-label">Category Title *</label>
                                <input 
                                    type="text"
                                    className="form-input"
                                    placeholder='e.g., General Assembly, Security Council, ECOSOC'
                                    value={categoryFormData.title}
                                    onChange={(e) => handleCategoryInputChange('title', e.target.value)}
                                    required
                                    autoFocus
                                />
                                <small className="char-count">
                                    {categoryFormData.title.length} characters
                                </small>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        setCategoryFormData({ title: '' });
                                    }}
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
                                    {loading ? 'Creating...' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};

export default AddCommittee;
