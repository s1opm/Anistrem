import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineX, HiOutlineCog, HiOutlinePhotograph } from 'react-icons/hi';
import { useCategoryStore } from '../../store.js';
import { formatFileSize } from '../../utils/index.js';
import toast from 'react-hot-toast';
import api from '../../services/api.js';

export default function AdminVideoUpload() {
  const navigate = useNavigate();
  const { categories, fetchCategories } = useCategoryStore();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingJob, setProcessingJob] = useState(null);
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    language: 'en',
    status: 'draft',
    allowComments: true,
    isFeatured: false,
    ageRestriction: 'none',
  });

  useEffect(() => { fetchCategories(); }, []);

  const handleFileSelect = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const videoTypes = ['video/mp4', 'video/webm', 'video/mkv', 'video/avi', 'video/mov'];
    if (!videoTypes.includes(selected.type)) {
      toast.error('Please select a valid video file');
      return;
    }
    if (selected.size > 10 * 1024 * 1024 * 1024) {
      toast.error('File size must be under 10GB');
      return;
    }
    setFile(selected);
    setFileInfo({
      name: selected.name,
      size: selected.size,
      type: selected.type,
    });
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setFileInfo({
        name: selected.name,
        size: selected.size,
        type: selected.type,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(selected);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(droppedFile);
      input.files = dt.files;
      Object.defineProperty(input, 'files', { value: dt.files });
      handleFileSelect({ target: input });
    }
  }, [handleFileSelect]);

  const handleThumbnailSelect = useCallback((e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!imageTypes.includes(selected.type)) {
      toast.error('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail must be under 5MB');
      return;
    }
    setThumbnailFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailPreview(ev.target.result);
    reader.readAsDataURL(selected);
  }, []);

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a video file'); return; }
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    if (!form.category) { toast.error('Please select a category'); return; }
    setUploading(true);
    setStep(3);

    try {
      let videoUrl = null;
      let thumbnailUrl = null;

      // Get signed upload URL from backend
      const signRes = await api.post('/api/uploads/presign', {
        filename: file.name,
        contentType: file.type || 'video/mp4',
        type: 'video',
      });
      const { uploadUrl, publicUrl: vidPublicUrl, token: supabaseToken } = signRes.data.data;
      videoUrl = vidPublicUrl;

      // Upload video directly to Supabase Storage
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseToken}`);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(`Video upload failed (${xhr.status}): ${xhr.responseText}`)); };
        xhr.onerror = () => reject(new Error('Network error uploading video'));
        xhr.send(file);
      });

      setUploadProgress(100);

      // Upload thumbnail directly to Supabase if provided
      if (thumbnailFile) {
        const thumbSignRes = await api.post('/api/uploads/presign', {
          filename: thumbnailFile.name,
          contentType: thumbnailFile.type || 'image/png',
          type: 'thumbnail',
        });
        const { uploadUrl: thumbUploadUrl, publicUrl: thumbPublicUrl, token: thumbToken } = thumbSignRes.data.data;
        thumbnailUrl = thumbPublicUrl;

        await fetch(thumbUploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${thumbToken}`,
            'Content-Type': thumbnailFile.type || 'image/png',
            'x-upsert': 'true',
          },
          body: thumbnailFile,
        });
      }

      const tagsArr = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      // Create video record in database
      const res = await api.post('/api/videos', {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        tags: tagsArr,
        language: form.language || undefined,
        status: form.status,
        allowComments: form.allowComments,
        isFeatured: form.isFeatured,
        ageRating: form.ageRestriction === 'none' ? 'G' : form.ageRestriction,
        videoUrl,
        thumbnail: thumbnailUrl,
      });

      toast.success('Video uploaded successfully!');
      navigate('/admin/videos');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      toast.error(msg);
      setUploading(false);
    }
  };

  const pollProcessingStatus = async (jobId) => {
    try {
      const res = await api.get(`/api/videos/process/${jobId}/status`);
      const status = res.data.data;
      setProcessingJob(status);
      if (status.status === 'completed') {
        toast.success('Video processed successfully!');
        navigate('/admin/videos');
      } else if (status.status === 'failed') {
        toast.error('Video processing failed');
        setUploading(false);
      } else {
        setTimeout(() => pollProcessingStatus(jobId), 3000);
      }
    } catch {
      setTimeout(() => pollProcessingStatus(jobId), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Upload Video</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-400'}`}>{s}</div>
            <span className={`text-sm hidden sm:inline ${step >= s ? 'text-white' : 'text-dark-400'}`}>{s === 1 ? 'Select File' : s === 2 ? 'Details' : 'Upload'}</span>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-500' : 'bg-dark-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: File Selection */}
      {step === 1 && (
        <div className="glass-card">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-dark-600 rounded-2xl p-12 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('video-input').click()}
          >
            <input id="video-input" type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
            {!file ? (
              <>
                <HiOutlineUpload className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Drop your video here</h3>
                <p className="text-dark-400 text-sm mb-4">or click to browse</p>
                <p className="text-dark-500 text-xs">MP4, WebM, MKV, AVI, MOV &middot; Max 10GB</p>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-white font-medium">{fileInfo?.name}</p>
                <p className="text-dark-400 text-sm">{formatFileSize(fileInfo?.size)} &middot; {fileInfo?.type}</p>
                {fileInfo?.duration && <p className="text-dark-400 text-sm">{Math.floor(fileInfo.duration / 60)}m {Math.floor(fileInfo.duration % 60)}s &middot; {fileInfo.width}x{fileInfo.height}</p>}
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setFileInfo(null); }} className="text-red-400 text-sm mt-2 inline-flex items-center gap-1"><HiOutlineX className="w-4 h-4" /> Remove</button>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => file && setStep(2)} disabled={!file} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="glass-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Video title" className="input-field" maxLength={200} required />
            <p className="text-xs text-dark-500 mt-1">{form.title.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Thumbnail</label>
            <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleThumbnailSelect} />
            {thumbnailPreview ? (
              <div className="relative group w-full max-w-sm">
                <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-40 object-cover rounded-xl border border-dark-600" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <button type="button" onClick={() => thumbInputRef.current?.click()} className="px-3 py-1.5 bg-dark-800 text-white text-sm rounded-lg hover:bg-dark-700 transition-colors">Change</button>
                  <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors">Remove</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => thumbInputRef.current?.click()} className="w-full max-w-sm h-40 border-2 border-dashed border-dark-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-500/50 transition-colors">
                <HiOutlinePhotograph className="w-10 h-10 text-dark-400" />
                <span className="text-sm text-dark-400">Click to upload thumbnail</span>
                <span className="text-xs text-dark-500">JPG, PNG, WebP &middot; Max 5MB</span>
              </button>
            )}
            <p className="text-xs text-dark-500 mt-1.5">Optional. If not uploaded, a frame will be auto-generated.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your video..." className="input-field h-32 resize-none" maxLength={5000} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="input-field">
                <option value="en">English</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Tags</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated tags" className="input-field" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Age Restriction</label>
              <select value={form.ageRestriction} onChange={(e) => setForm({ ...form, ageRestriction: e.target.value })} className="input-field">
                <option value="none">None</option>
                <option value="13+">13+</option>
                <option value="16+">16+</option>
                <option value="18+">18+</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allowComments} onChange={(e) => setForm({ ...form, allowComments: e.target.checked })} className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500" />
              <span className="text-sm text-dark-300">Allow comments</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500" />
              <span className="text-sm text-dark-300">Featured</span>
            </label>
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button onClick={handleUpload} className="btn-primary flex items-center gap-2"><HiOutlineUpload className="w-4 h-4" /> Upload Video</button>
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
        <div className="glass-card text-center py-12">
          {processingJob ? (
            <>
              <HiOutlineCog className="w-16 h-16 text-primary-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">Processing Video</h3>
              <p className="text-dark-400 mb-6">Generating thumbnails and encoding resolutions...</p>
              {processingJob.progress !== undefined && (
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${processingJob.progress || uploadProgress}%` }} />
                  </div>
                  <p className="text-sm text-dark-400 mt-2">{processingJob.progress || uploadProgress}%</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Uploading Video</h3>
              <p className="text-dark-400 mb-6">Please don't close this page</p>
              <div className="max-w-md mx-auto">
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-sm text-dark-400 mt-2">{uploadProgress}% uploaded</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}