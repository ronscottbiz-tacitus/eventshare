import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UploadPhotos = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [files, setFiles] = useState([]);
  const [captions, setCaptions] = useState({});
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cameraInputRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length + files.length > 20) {
      toast.error('You can upload up to 20 photos at once');
      return;
    }

    const newFiles = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36),
    }));

    setFiles([...files, ...newFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
    maxFiles: 20,
  });

  const handleCameraCapture = (event) => {
    const capturedFiles = Array.from(event.target.files);
    const imageFiles = capturedFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length + files.length > 20) {
      toast.error('You can upload up to 20 photos at once');
      return;
    }

    const newFiles = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36),
    }));

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(files.filter((f) => f.id !== id));
    const newCaptions = { ...captions };
    delete newCaptions[id];
    setCaptions(newCaptions);
    if (currentIndex >= files.length - 1) {
      setCurrentIndex(Math.max(0, files.length - 2));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('files', f.file);
      });

      const captionsArray = files.map((f) => captions[f.id] || '');
      formData.append('captions', captionsArray.join('||||'));

      await axios.post(`${API}/events/${eventId}/media`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded successfully!`);
      navigate(`/events/${eventId}/gallery`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const currentFile = files[currentIndex];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          data-testid="back-btn"
          onClick={() => navigate(`/events/${eventId}/gallery`)}
          variant="ghost"
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Add Photos
          </h1>
          <p className="text-gray-400 mb-8">Select up to 20 photos to upload</p>

          {files.length === 0 ? (
            <div className="space-y-4">
              {/* Camera Capture Button */}
              <div className="text-center">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <Button
                  data-testid="take-photo-btn"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl px-8 py-8 text-lg font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
                >
                  <Camera className="w-8 h-8 mr-3" />
                  Take Photo with Camera
                </Button>
                <p className="text-gray-500 text-sm mt-2">Opens your device camera</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-gray-400">or</span>
                </div>
              </div>

              {/* Gallery Selection */}
              <div
                {...getRootProps()}
                className={`border-4 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-blue-400 hover:bg-blue-500/5'
                }`}
                data-testid="dropzone"
              >
                <input {...getInputProps()} />
                <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-white mb-2">
                  {isDragActive ? 'Drop photos here' : 'Choose from Gallery'}
                </p>
                <p className="text-gray-400 mb-6">Drag & drop or click to browse</p>
                <Button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-8 py-3"
                >
                  Browse Files
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-semibold text-white">
                    Photo {currentIndex + 1} of {files.length}
                  </p>
                  <Button
                    data-testid="remove-current-photo-btn"
                    onClick={() => removeFile(currentFile.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-5 h-5 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="bg-black/50 rounded-xl overflow-hidden mb-4 border border-white/10">
                  <img
                    src={currentFile.preview}
                    alt="Preview"
                    className="w-full h-96 object-contain"
                    data-testid="photo-preview"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">
                    Add a caption (optional)
                  </label>
                  <Textarea
                    data-testid="caption-input"
                    value={captions[currentFile.id] || ''}
                    onChange={(e) =>
                      setCaptions({ ...captions, [currentFile.id]: e.target.value })
                    }
                    placeholder="Add an optional caption..."
                    rows={3}
                    className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-white/10"
                  />
                </div>
              </div>

              {files.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {files.map((f, idx) => (
                    <div
                      key={f.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-3 transition-all ${
                        idx === currentIndex
                          ? 'border-emerald-500 ring-2 ring-emerald-500'
                          : 'border-transparent hover:border-emerald-300'
                      }`}
                    >
                      <img
                        src={f.preview}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <div {...getRootProps()} className="flex-1">
                  <input {...getInputProps()} />
                  <Button
                    data-testid="add-more-btn"
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-full font-semibold"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Add More Photos
                  </Button>
                </div>

                <Button
                  data-testid="upload-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-12 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {uploading ? (
                    'Uploading...'
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload {files.length} Photo{files.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPhotos;