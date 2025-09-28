import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface UploaderProps {
  onUpload: (file: File) => void;
  title: string;
  acceptedTypes: string;
  uploading: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onUpload, title, acceptedTypes, uploading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-card dark:bg-slate-800 p-6 rounded-lg shadow-md w-full">
      <h3 className="text-xl font-semibold text-text-main dark:text-slate-100 mb-4">{title}</h3>
      <form
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragActive ? 'border-primary bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-slate-600'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedTypes}
          onChange={handleChange}
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-text-light dark:text-slate-400">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{acceptedTypes}</p>
        </label>
        {uploading && (
          <div className="mt-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-text-light dark:text-slate-400 mt-2">Processing...</p>
          </div>
        )}
      </form>
    </div>
  );
};