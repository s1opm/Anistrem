import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVideoStore, useCategoryStore } from '../../store.js';
import VideoGrid from '../../components/video/VideoGrid.jsx';

export default function VideosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { videos, fetchVideos, pagination, isLoading } = useVideoStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-publishedAt');
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchCategories({ isActive: true, limit: 50 });
  }, []);

  useEffect(() => {
    const params = { page, limit: 20, status: 'published', sort: sortBy };
    if (selectedCategory) params.category = selectedCategory;
    fetchVideos(params);
  }, [page, selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">All Videos</h1>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSearchParams(p => { p.delete('page'); return p; }); }} className="input-field-sm w-auto">
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field-sm w-auto">
          <option value="-publishedAt">Latest</option>
          <option value="-viewCount">Most Viewed</option>
          <option value="-likeCount">Most Liked</option>
          <option value="title">Title A-Z</option>
          <option value="-title">Title Z-A</option>
        </select>
      </div>
      <VideoGrid videos={videos} loading={isLoading} />
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(pagination.pages, 10) }).map((_, i) => (
            <button key={i} onClick={() => setSearchParams({ page: String(i + 1), ...(selectedCategory && { category: selectedCategory }) })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}