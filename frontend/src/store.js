import { create } from 'zustand';
import api from './services/api.js';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return 'dark';
  }
  return 'dark';
};

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: newTheme });
  },
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },
}));

export const useAuthStore = create((set, get) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  setAdmin: (admin) => set({ admin, isAuthenticated: !!admin, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.post('/api/admin/login', { email, password });
      const data = response.data?.data;
      if (!data?.admin || !data?.accessToken) {
        throw new Error(response.data?.message || 'Invalid login response');
      }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('admin', JSON.stringify(data.admin));
      set({ admin: data.admin, isAuthenticated: true, isLoading: false, error: null });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  
  logout: async () => {
    try {

      await api.post('/api/admin/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin');
      set({ admin: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {

      const response = await api.get('/api/admin/me');
      const admin = response.data?.data?.admin;
      if (admin) {
        set({ admin, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('admin');
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      localStorage.removeItem('admin');
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  initialize: () => {
    try {
      const savedAdmin = localStorage.getItem('admin');
      if (savedAdmin) {
        const admin = JSON.parse(savedAdmin);
        if (admin && admin.email) {
          set({ admin, isAuthenticated: true, isLoading: false });
          get().checkAuth();
        } else {
          localStorage.removeItem('admin');
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      try { localStorage.removeItem('admin'); } catch {}
      set({ isLoading: false });
    }
  },
}));

export const useVideoStore = create((set, get) => ({
  videos: [],
  currentVideo: null,
  featuredVideos: [],
  trendingVideos: [],
  latestVideos: [],
  relatedVideos: [],
  searchResults: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  
  setVideos: (videos) => set({ videos }),
  setCurrentVideo: (video) => set({ currentVideo: video }),
  setFeaturedVideos: (videos) => set({ featuredVideos: videos }),
  setTrendingVideos: (videos) => set({ trendingVideos: videos }),
  setLatestVideos: (videos) => set({ latestVideos: videos }),
  setRelatedVideos: (videos) => set({ relatedVideos: videos }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPagination: (pagination) => set({ pagination }),
  
  fetchVideos: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get('/api/videos', { params });
      const data = response.data?.data;
      const pagination = response.data?.pagination;
      set({ videos: Array.isArray(data) ? data : [], pagination: pagination || { page: 1, limit: 20, total: 0, pages: 0 }, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
  
  fetchVideo: async (id) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get(`/api/videos/${id}`);
      const video = response.data?.data || null;
      set({ currentVideo: video, isLoading: false });
      return video;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
  
  fetchFeatured: async (limit = 10) => {
    try {

      const response = await api.get('/api/videos/featured', { params: { limit } });
      const data = response.data?.data;
      set({ featuredVideos: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch featured error:', error);
      return [];
    }
  },
  
  fetchTrending: async (limit = 10) => {
    try {

      const response = await api.get('/api/videos/trending', { params: { limit } });
      const data = response.data?.data;
      set({ trendingVideos: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch trending error:', error);
      return [];
    }
  },
  
  fetchLatest: async (limit = 12) => {
    try {

      const response = await api.get('/api/videos', { params: { limit, sort: '-publishedAt', status: 'published' } });
      const data = response.data?.data;
      set({ latestVideos: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch latest error:', error);
      return [];
    }
  },
  
  fetchRelated: async (videoId, limit = 10) => {
    try {

      const response = await api.get(`/api/videos/${videoId}/related`, { params: { limit } });
      const data = response.data?.data;
      set({ relatedVideos: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch related error:', error);
      return [];
    }
  },
  
  searchVideos: async (query, params = {}) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get('/api/videos/search', { params: { q: query, ...params } });
      const data = response.data?.data;
      const pagination = response.data?.pagination;
      set({ searchResults: Array.isArray(data) ? data : [], pagination: pagination || { page: 1, limit: 20, total: 0, pages: 0 }, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
}));

export const useCategoryStore = create((set) => ({
  categories: [],
  categoryTree: [],
  homepageCategories: [],
  featuredCategories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
  
  setCategories: (categories) => set({ categories }),
  setCategoryTree: (tree) => set({ categoryTree: tree }),
  setHomepageCategories: (categories) => set({ homepageCategories: categories }),
  setFeaturedCategories: (categories) => set({ featuredCategories: categories }),
  setCurrentCategory: (category) => set({ currentCategory: category }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  fetchCategories: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get('/api/categories', { params });
      const data = response.data?.data;
      set({ categories: Array.isArray(data) ? data : [], isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
  
  fetchCategoryTree: async () => {
    try {

      const response = await api.get('/api/categories/tree');
      const data = response.data?.data;
      set({ categoryTree: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch category tree error:', error);
      return [];
    }
  },
  
  fetchHomepageCategories: async () => {
    try {

      const response = await api.get('/api/categories/homepage');
      const data = response.data?.data;
      set({ homepageCategories: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch homepage categories error:', error);
      return [];
    }
  },
  
  fetchFeaturedCategories: async (limit = 10) => {
    try {

      const response = await api.get('/api/categories/featured', { params: { limit } });
      const data = response.data?.data;
      set({ featuredCategories: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch featured categories error:', error);
      return [];
    }
  },
  
  fetchCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get(`/api/categories/${id}`);
      const data = response.data?.data;
      set({ currentCategory: data || null, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
}));

export const useAdminStore = create((set) => ({
  stats: null,
  recentActivity: [],
  isLoading: false,
  error: null,
  
  setStats: (stats) => set({ stats }),
  setRecentActivity: (activity) => set({ recentActivity: activity }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  fetchDashboard: async (period = '30d') => {
    set({ isLoading: true, error: null });
    try {

      const response = await api.get('/api/dashboard', { params: { period } });
      const data = response.data?.data;
      set({ stats: data || null, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false, error: error.message });
      throw error;
    }
  },
  
  fetchRecentActivity: async (limit = 20) => {
    try {

      const response = await api.get('/api/dashboard/recent-activity', { params: { limit } });
      const data = response.data?.data;
      set({ recentActivity: Array.isArray(data) ? data : [] });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch recent activity error:', error);
      return [];
    }
  },
}));

export const usePlayerStore = create((set, get) => ({
  isPlaying: false,
  isMuted: false,
  volume: 1,
  isFullscreen: false,
  isPIP: false,
  playbackRate: 1,
  quality: 'auto',
  currentTime: 0,
  duration: 0,
  buffered: 0,
  isLoading: false,
  isSeeking: false,
  showControls: true,
  showSettings: false,
  showSubtitles: false,
  currentSubtitle: null,
  
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setPIP: (isPIP) => set({ isPIP }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setQuality: (quality) => set({ quality }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered }),
  setLoading: (isLoading) => set({ isLoading }),
  setSeeking: (isSeeking) => set({ isSeeking }),
  setShowControls: (showControls) => set({ showControls }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setSubtitles: (showSubtitles) => set({ showSubtitles }),
  setCurrentSubtitle: (currentSubtitle) => set({ currentSubtitle }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
  togglePIP: () => set((state) => ({ isPIP: !state.isPIP })),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  toggleSubtitles: () => set((state) => ({ showSubtitles: !state.showSubtitles })),
  
  seekTo: (time) => set({ currentTime: time }),
  skipForward: (seconds = 10) => set((state) => ({ currentTime: Math.min(state.duration, state.currentTime + seconds) })),
  skipBackward: (seconds = 10) => set((state) => ({ currentTime: Math.max(0, state.currentTime - seconds) })),
  increaseVolume: () => set((state) => ({ volume: Math.min(1, state.volume + 0.1) })),
  decreaseVolume: () => set((state) => ({ volume: Math.max(0, state.volume - 0.1) })),
  
  cyclePlaybackRate: () => {
    const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    const current = get().playbackRate;
    const index = rates.indexOf(current);
    const nextIndex = (index + 1) % rates.length;
    set({ playbackRate: rates[nextIndex] });
  },
  
  reset: () => set({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    isFullscreen: false,
    isPIP: false,
    playbackRate: 1,
    quality: 'auto',
    currentTime: 0,
    duration: 0,
    buffered: 0,
    isLoading: false,
    isSeeking: false,
  }),
}));

export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  showScrollToTop: false,
  toasts: [],
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowScrollToTop: (showScrollToTop) => set({ showScrollToTop }),
  
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: Date.now() }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));