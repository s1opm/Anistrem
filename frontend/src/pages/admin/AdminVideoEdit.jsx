import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { HiOutlineSave, HiOutlineArrowLeft, HiOutlinePhotograph } from 'react-icons/hi';
import { useCategoryStore } from '../../store.js';
import toast from 'react-hot-toast';
import api from '../../services/api.js';

export default function AdminVideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, fetchCategories } = useCategoryStore();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', category: '', tags: '', language: 'en',
    status: 'draft', allowComments: true, isFeatured: false, ageRestriction: 'none',
  });

  useEffect(() => {
    fetchCategories();
    api.get(`/api/videos/${id}`)
      .then(res => {
        const v = res.data.data;
        setVideo(v);
        setForm({
          title: v.title || '', description: v.description || '',
          category: v.category?.id || v.category || '', tags: (v.tags || []).join(', '),
          language: v.language || 'en', status: v.status || 'draft',
          allowComments: v.allowComments !== false,
          isFeatured: v.isFeatured || false, ageRestriction: v.ageRestriction || 'none',
        });
        setLoading(false);
        if (v.thumbnail?.url) setThumbnailPreview(v.thumbnail.url);
      })
      .catch(() => { toast.error('Video not found'); navigate('/admin/videos'); });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        formData.append('title', form.title);
        if (form.description) formData.append('description', form.description);
        if (form.category) formData.append('category', form.category);
        if (form.tags) {
          form.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(tag => formData.append('tags', tag));
        }
        if (form.language) formData.append('language', form.language);
        if (form.status) formData.append('status', form.status);
        formData.append('allowComments', form.allowComments);
        formData.append('isFeatured', form.isFeatured);
        await api.put(`/api/videos/${id}`, formData, { headers: { 'Content-Type': undefined } });
      } else {
        await api.put(`/api/videos/${id}`, {
          ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });
      }
      toast.success('Video updated');
      navigate('/admin/videos');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this video?')) return;
    try {
      await api.delete(`/api/videos/${id}`);
      toast.success('Video deleted');
      navigate('/admin/videos');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!video) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/videos" className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"><HiOutlineArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Edit Video</h1>
          <p className="text-dark-400 text-sm truncate">{video.title}</p>
        </div>
        <button onClick={handleDelete} className="btn-danger text-sm">Delete Video</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" maxLength={200} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-40 resize-none" maxLength={5000} />
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
                  <option value="en">English</option><option value="ja">Japanese</option><option value="ko">Korean</option>
                  <option value="zh">Chinese</option><option value="es">Spanish</option><option value="pt">Portuguese</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Tags</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated" className="input-field" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Age Restriction</label>
                <select value={form.ageRestriction} onChange={(e) => setForm({ ...form, ageRestriction: e.target.value })} className="input-field">
                  <option value="none">None</option><option value="13+">13+</option><option value="16+">16+</option><option value="18+">18+</option>
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card">
            <h3 className="font-bold text-white mb-3">Preview</h3>
            <div className="aspect-video rounded-xl overflow-hidden bg-dark-800">
              {thumbnailPreview ? <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-bg opacity-30" />}
            </div>
            <input ref={thumbInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { toast.error('Invalid image type'); return; }
              if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
              setThumbnailFile(f);
              const reader = new FileReader();
              reader.onload = (ev) => setThumbnailPreview(ev.target.result);
              reader.readAsDataURL(f);
            }} />
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => thumbInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
                <HiOutlinePhotograph className="w-4 h-4" /> Change Thumbnail
              </button>
              {thumbnailPreview && thumbnailFile && (
                <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(video?.thumbnail?.url || null); }} className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm text-red-400 transition-colors">Revert</button>
              )}
            </div>
          </div>
          <div className="glass-card">
            <h3 className="font-bold text-white mb-3">Video Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-dark-400">Views</span><span className="text-white">{video.viewCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Likes</span><span className="text-white">{video.likeCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Status</span><span className={`font-medium ${video.status === 'published' ? 'text-green-400' : 'text-yellow-400'}`}>{video.status}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Created</span><span className="text-white">{new Date(video.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Updated</span><span className="text-white">{new Date(video.updatedAt).toLocaleDateString()}</span></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><HiOutlineSave className="w-4 h-4" /> Save Changes</>}
            </button>
            <Link to={`/watch/${video.slug || video.id}`} className="btn-secondary flex items-center justify-center">View</Link>
          </div>
        </div>
      </div>
    </div>
  );
}