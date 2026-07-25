import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useVideoStore, useCategoryStore } from '../../store.js';
import VideoGrid from '../../components/video/VideoGrid.jsx';
import api from '../../services/api.js';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { videos, fetchVideos, isLoading } = useVideoStore();
  const [category, setCategory] = useState(null);
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/categories/slug/${slug}`);
        setCategory(res.data.data);
      } catch { setCategory(null); }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (category) {
      fetchVideos({ category: category._id, page, limit: 20, status: 'published' });
    }
  }, [category, page]);

  if (!category && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Category Not Found</h2>
        <p className="text-dark-400">This category doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {category && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {category.icon && <span className="text-3xl">{category.icon}</span>}
            <h1 className="text-3xl font-bold text-white">{category.name}</h1>
          </div>
          {category.description && <p className="text-dark-400 mt-2">{category.description}</p>}
        </div>
      )}
      <VideoGrid videos={videos} loading={isLoading} />
    </div>
  );
}