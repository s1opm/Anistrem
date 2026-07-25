import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { formatNumber, formatTimeAgo } from '../../utils/index.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export default function AdminVideos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || 'all',
    sort: searchParams.get('sort') || '-createdAt',
  });
  const page = parseInt(searchParams.get('page') || '1');

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: filters.sort };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      const res = await api.get('/api/videos', { params });
      setVideos(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error('Failed to load videos');
    }
    setLoading(false);
  };

  useEffect(() => {
    api.get('/api/categories', { params: { isActive: true, limit: 50 } })
      .then(res => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchVideos(); }, [page, filters]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/api/videos/${id}`);
      toast.success('Video deleted');
      fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      if (status === 'published') {
        await api.patch(`/api/videos/${id}/publish`);
      } else if (status === 'unlisted') {
        await api.patch(`/api/videos/${id}/unpublish`);
      }
      toast.success('Status updated');
      fetchVideos();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Videos</h1>
        <Link to="/admin/videos/upload" className="btn-primary text-sm flex items-center gap-1.5">
          <HiOutlinePlus className="w-4 h-4" /> Upload Video
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field-sm pl-9 w-full"
          />
        </div>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="input-field-sm w-auto">
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-field-sm w-auto">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="processing">Processing</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="input-field-sm w-auto">
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
          <option value="-viewCount">Most Viewed</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {/* Videos Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : videos.length === 0 ? (
        <div className="glass-card text-center py-12">
          <p className="text-dark-400 mb-4">No videos found</p>
          <Link to="/admin/videos/upload" className="btn-primary inline-flex items-center gap-1.5">
            <HiOutlinePlus className="w-4 h-4" /> Upload Your First Video
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-400 border-b border-dark-700/50">
                <th className="text-left py-3 px-3">Video</th>
                <th className="text-left py-3 px-3">Category</th>
                <th className="text-left py-3 px-3">Status</th>
                <th className="text-left py-3 px-3">Views</th>
                <th className="text-left py-3 px-3">Created</th>
                <th className="text-right py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b border-dark-700/30 hover:bg-dark-700/20 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                        {video.thumbnail?.url ? <img src={video.thumbnail.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full gradient-bg opacity-30" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate max-w-[200px]">{video.title}</p>
                        <p className="text-xs text-dark-400">{video.category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-dark-300">{video.category?.name || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      video.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      video.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      video.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-dark-600 text-dark-300'
                    }`}>{video.status}</span>
                  </td>
                  <td className="py-3 px-3 text-dark-300">{formatNumber(video.viewCount)}</td>
                  <td className="py-3 px-3 text-dark-400 text-xs">{formatTimeAgo(video.createdAt)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-2">
                      {video.status !== 'published' && (
                        <button onClick={() => handleStatusChange(video.id, 'published')} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded bg-green-500/10">Publish</button>
                      )}
                      {video.status === 'published' && (
                        <button onClick={() => handleStatusChange(video.id, 'unlisted')} className="text-xs text-yellow-400 hover:text-yellow-300 px-2 py-1 rounded bg-yellow-500/10">Unpublish</button>
                      )}
                      <Link to={`/admin/videos/edit/${video.id}`} className="p-1.5 text-dark-400 hover:text-primary-400 rounded-lg hover:bg-dark-700/50 transition-colors">
                        <HiOutlinePencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(video.id)} className="p-1.5 text-dark-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pagination.pages, 10) }).map((_, i) => (
            <button key={i} onClick={() => setSearchParams({ page: String(i + 1) })} className={`px-3 py-1.5 rounded-lg text-sm ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}