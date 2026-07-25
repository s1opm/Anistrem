import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiSearch, HiX } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useDebounce } from '../../hooks/index.js';
import { useUIStore } from '../../store.js';
import api from '../../services/api.js';

export default function SearchOverlay() {
  const { setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      api.get('/api/videos/search', { params: { q: debouncedQuery, limit: 8 } })
        .then(res => { const data = res.data?.data; setResults(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    api.get('/api/categories', { params: { isActive: true, limit: 8 } })
      .then(res => { const data = res.data?.data; if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSelect = (video) => {
    navigate(`/watch/${video.slug}`);
    setSearchOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="w-full max-w-2xl glass rounded-2xl overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleSearch} className="flex items-center gap-3 px-5 py-4 border-b border-dark-600/50">
          <HiSearch className="w-5 h-5 text-dark-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, categories..."
            className="flex-1 bg-transparent border-none text-white text-lg placeholder-dark-400 focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1 text-dark-400 hover:text-white">
              <HiX className="w-5 h-5" />
            </button>
          )}
          <button type="button" onClick={() => setSearchOpen(false)} className="p-1 text-dark-400 hover:text-white">
            <HiX className="w-5 h-5" />
          </button>
        </form>

        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs text-dark-400 uppercase tracking-wider">Videos</p>
              {results.map((video) => (
                <button key={video.id || video._id} onClick={() => handleSelect(video)} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors text-left">
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-dark-800 shrink-0">
                    {video.thumbnail?.url ? (
                      <img src={video.thumbnail.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-bg opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{video.title}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{video.viewCount?.toLocaleString() || 0} views</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-dark-400">No results found for "{query}"</div>
          )}

          {!loading && query.length < 2 && categories.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-xs text-dark-400 uppercase tracking-wider">Popular Categories</p>
              <div className="grid grid-cols-2 gap-1">
                {categories.map((cat) => (
                  <button key={cat._id} onClick={() => { navigate(`/category/${cat.slug}`); setSearchOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors text-left">
                    {cat.icon && <span className="text-lg">{cat.icon}</span>}
                    <span className="text-sm text-dark-300">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}