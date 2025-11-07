import { useState } from 'react';
import axiosClient from '../utils/axiosClient'; 
import axios from 'axios'; // Import plain axios for Cloudinary upload

// Props:
// - problemId: string
// - problemTitle: string
// - isOpen: boolean
// - onClose: function
export default function UploadVideoModal({ problemId, problemTitle, isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid video file.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Get upload signature from our backend
      const sigResponse = await axiosClient.get(`/video/create/${problemId}`);
      const { signature, timestamp, public_id, api_key, upload_url } = sigResponse.data;

      // 2. Upload file to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('public_id', public_id);

      // Use plain axios for Cloudinary POST, with progress tracking
      const cloudinaryResponse = await axios.post(upload_url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      const videoData = cloudinaryResponse.data;

      // 3. Save metadata to our backend
      await axiosClient.post('/video/save', {
        problemId: problemId,
        cloudinaryPublicId: videoData.public_id,
        secureUrl: videoData.secure_url,
        duration: videoData.duration,
      });

      // 4. Success
      alert('Video uploaded successfully!');
      handleClose();

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please check the console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return; // Don't close while uploading
    setFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Upload Video Solution</h3>
        <p className="py-2 text-sm text-base-content/80">
          For problem: <span className="font-medium">{problemTitle}</span>
        </p>

        <div className="form-control w-full mt-4">
          <input
            type="file"
            accept="video/*"
            className="file-input file-input-bordered w-full"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          {file && !isUploading && (
            <span className="text-xs mt-2 text-base-content/70">Selected: {file.name}</span>
          )}
        </div>

        {isUploading && (
          <div className="mt-4">
            <progress
              className="progress progress-primary w-full"
              value={uploadProgress}
              max="100"
            ></progress>
            <span className="text-sm font-medium">{uploadProgress}% Complete</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error shadow-lg mt-4">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2.93V5.5a3 3 0 00-3-3h-1.144a1 1 0 00-.94-.661l-3.027-.505A1 1 0 008.695 1H8.5A3 3 0 005.5 4v.789c0 .529-.213 1.02-.586 1.386l-1.54 1.541a.5.5 0 000 .708l1.54 1.54a.5.5 0 00.708 0l1.54-1.54a1.06 1.06 0 011.386-.586V19.5a3 3 0 003 3h1.144a1 1 0 00.94.661l3.027.505a1 1 0 001.03-.661H18.5a3 3 0 003-3v-2.289a.5.5 0 00-.146-.353l-1.54-1.54a.5.5 0 00-.708 0l-1.54 1.54a1.06 1.06 0 01-1.386.586V8.5a3 3 0 00-3-3H9.211a.5.5 0 00-.353.146l-1.54 1.54a.5.5 0 000 .708l1.54 1.54a.5.5 0 00.708 0l1.54-1.54a1.06 1.06 0 011.386-.586z" /></svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={handleClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            className={`btn btn-primary ${isUploading ? 'loading' : ''}`}
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
      {/* Click outside to close */}
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}