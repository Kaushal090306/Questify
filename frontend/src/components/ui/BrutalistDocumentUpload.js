import React from 'react';
import { DocumentIcon, DocumentTextIcon, PresentationChartLineIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import './BrutalistDocumentUpload.css';

const BrutalistDocumentUpload = ({ 
  files = [], 
  onFilesChange, 
  onFileRemove, 
  onFileView,
  dragActive, 
  onDrag, 
  onDrop, 
  fileInputRef,
  error,
  maxFiles = 5,
  maxSizePerFile = 10 // MB
}) => {

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <DocumentIcon className="w-6 h-6 text-red-600" />;
      case 'docx':
      case 'doc':
        return <DocumentTextIcon className="w-6 h-6 text-blue-600" />;
      case 'pptx':
      case 'ppt':
        return <PresentationChartLineIcon className="w-6 h-6 text-orange-600" />;
      default:
        return <DocumentIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileView = (file, index) => {
    if (onFileView) {
      onFileView(file, index);
    } else {
      // Default behavior - create URL for the file and open
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  return (
    <div className="brutalist-document-upload">
      <div className="upload-header">
        <h2 className="upload-title">UPLOAD DOCUMENTS</h2>
        <div className="upload-subtitle">
          Drag & drop or click to select files (PDF, DOCX, PPTX)
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        onClick={handleFileSelect}
      >
        <div className="dropzone-content">
          {files.length === 0 ? (
            <>
              <div className="upload-icon">
                <DocumentIcon className="w-12 h-12" />
              </div>
              <div className="upload-text">
                <div className="primary-text">Click to upload or drag and drop</div>
                <div className="secondary-text">
                  PDF, DOCX, PPTX files up to {maxSizePerFile}MB each
                </div>
                <div className="tertiary-text">
                  Maximum {maxFiles} files allowed
                </div>
              </div>
            </>
          ) : (
            <div className="files-summary">
              <div className="summary-icon">
                <DocumentIcon className="w-8 h-8" />
              </div>
              <div className="summary-text">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
              <div className="add-more-text">
                Click to add more files
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.doc,.ppt"
          multiple
          onChange={(e) => onFilesChange(e.target.files)}
          className="hidden-input"
        />
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {/* Uploaded Files Display */}
      {files.length > 0 && (
        <div className="uploaded-files">
          <div className="files-header">
            <span className="files-count">Selected Files ({files.length})</span>
          </div>
          
          <div className="files-grid">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="file-card">
                <div className="file-header">
                  <div className="file-icon">
                    {getFileIcon(file.name)}
                  </div>
                </div>
                
                <div className="file-info">
                  <div className="file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="file-size">
                    {formatFileSize(file.size)} MB
                  </div>
                </div>

                <div className="file-actions">
                  <button
                    type="button"
                    className="view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileView(file, index);
                    }}
                    title="View file"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove(index);
                  }}
                  title="Remove file"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrutalistDocumentUpload;
