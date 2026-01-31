import { useState, useRef } from 'react';
import './CraftUpload.css';

const CraftUpload = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    origin: '',
    materials: '',
    technique: '',
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  const categories = [
    'Pottery',
    'Textile',
    'Woodwork',
    'Metalwork',
    'Jewelry',
    'Painting',
    'Sculpture',
    'Weaving',
    'Embroidery',
    'Paper Craft',
    'Leather Work',
    'Stone Carving',
    'Other',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValid && isUnder5MB;
    });

    if (validFiles.length !== fileArray.length) {
      setErrors(prev => ({
        ...prev,
        images: 'Some files were skipped. Only images under 5MB are allowed.',
      }));
    }

    // Limit to 5 images
    const remainingSlots = 5 - images.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    setImages(prev => [...prev, ...filesToAdd]);

    // Create previews
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, { url: reader.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    if (filesToAdd.length < validFiles.length) {
      setErrors(prev => ({
        ...prev,
        images: 'Maximum 5 images allowed.',
      }));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleImageSelect(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageSelect(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Craft name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }

    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/crafts', {
      //   method: 'POST',
      //   body: formDataToSend,
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccessMessage('Craft uploaded successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        origin: '',
        materials: '',
        technique: '',
      });
      setImages([]);
      setImagePreviews([]);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      setErrors({ submit: 'Failed to upload craft. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="craft-upload-container">
      <div className="craft-upload-header">
        <h1>Upload New Craft</h1>
        <p>Share your craft with the community</p>
      </div>

      {successMessage && (
        <div className="success-message">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {successMessage}
        </div>
      )}

      {errors.submit && (
        <div className="error-message">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="craft-upload-form">
        {/* Image Upload Section */}
        <div className="form-section">
          <h2>Craft Images</h2>
          <p className="section-description">Upload up to 5 images (max 5MB each)</p>

          <div
            className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-hint">PNG, JPG, GIF up to 5MB</p>
          </div>

          {errors.images && <p className="field-error">{errors.images}</p>}

          {imagePreviews.length > 0 && (
            <div className="image-preview-grid">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview-item">
                  <img src={preview.url} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                    aria-label="Remove image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  <p className="image-name">{preview.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">
              Craft Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter craft name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="category">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="field-error">{errors.category}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the craft, its history, and significance..."
              rows="6"
              className={errors.description ? 'error' : ''}
            />
            <p className="char-count">{formData.description.length} characters</p>
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>
        </div>

        {/* Additional Details */}
        <div className="form-section">
          <h2>Additional Details</h2>

          <div className="form-group">
            <label htmlFor="origin">
              Origin/Region <span className="required">*</span>
            </label>
            <input
              type="text"
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              placeholder="e.g., Jaipur, Rajasthan"
              className={errors.origin ? 'error' : ''}
            />
            {errors.origin && <p className="field-error">{errors.origin}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="materials">Materials Used</label>
            <input
              type="text"
              id="materials"
              name="materials"
              value={formData.materials}
              onChange={handleInputChange}
              placeholder="e.g., Clay, Wood, Cotton"
            />
          </div>

          <div className="form-group">
            <label htmlFor="technique">Technique/Method</label>
            <textarea
              id="technique"
              name="technique"
              value={formData.technique}
              onChange={handleInputChange}
              placeholder="Describe the technique used to create this craft..."
              rows="4"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                category: '',
                origin: '',
                materials: '',
                technique: '',
              });
              setImages([]);
              setImagePreviews([]);
              setErrors({});
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              'Upload Craft'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CraftUpload;
