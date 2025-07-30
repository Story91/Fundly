import React, { useState, useRef } from 'react';

const ImageUploadField = ({ value, onChange, placeholder = "Image URL or upload file", dark }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef(null);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Pass the file object to parent component
      onChange(file);
    }
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreviewUrl(url);
    onChange(url);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onChange(file);
      }
    }
  };

  // Trigger file input
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: '500',
        color: dark ? '#e2e8f0' : '#374151'
      }}>
        Campaign Image
      </label>
      
      {/* URL Input */}
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={handleUrlChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: dark ? 'rgba(255,255,255,0.05)' : '#ffffff',
          color: dark ? '#e2e8f0' : '#374151',
          marginBottom: '12px'
        }}
      />

      {/* File Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{
          border: `2px dashed ${dragActive ? '#3b82f6' : dark ? 'rgba(255,255,255,0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? 
            (dark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)') : 
            (dark ? 'rgba(255,255,255,0.02)' : 'rgba(248, 250, 252, 0.5)'),
          transition: 'all 0.3s ease',
          marginBottom: '12px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
        <div style={{ 
          fontSize: '14px', 
          color: dark ? '#94a3b8' : '#64748b',
          marginBottom: '4px' 
        }}>
          Click to upload or drag and drop
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: dark ? '#64748b' : '#94a3b8' 
        }}>
          PNG, JPG, GIF up to 10MB
        </div>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div style={{
          border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img 
            src={previewUrl} 
            alt="Preview" 
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover'
            }}
            onError={() => {
              setPreviewUrl(null);
              console.warn('Failed to load image preview');
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewUrl(null);
              onChange('');
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;