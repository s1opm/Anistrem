import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};

export const useInfiniteScroll = (fetchMore, options = {}) => {
  const { threshold = 200, enabled = true } = options;
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  
  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && enabled) {
            setLoading(true);
            fetchMore()
              .then((data) => {
                if (data && data.length === 0) setHasMore(false);
                setLoading(false);
              })
              .catch(() => setLoading(false));
          }
        },
        { rootMargin: `${threshold}px` }
      );
      
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, enabled, fetchMore, threshold]
  );
  
  return { lastElementRef, loading, hasMore, setHasMore };
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
};

export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

export const useKeyPress = (targetKey, handler) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === targetKey) {
        handler(event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, handler]);
};

export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const ticking = useRef(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setScrollPosition(window.scrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return scrollPosition;
};

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
};

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
};

export const useApi = (url, options = {}) => {
  const { immediate = true, params = {}, onSuccess, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = useCallback(async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(url, { params: { ...params, ...overrideParams } });
      setData(response.data.data);
      onSuccess?.(response.data.data);
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params), onSuccess, onError]);
  
  useEffect(() => {
    if (immediate) execute();
  }, [immediate, execute]);
  
  return { data, loading, error, execute, setData };
};

export const useVideoProgress = (videoId) => {
  const [progress, setProgress] = useLocalStorage(`video_progress_${videoId}`, {
    time: 0,
    duration: 0,
    percentage: 0,
    completed: false,
    lastWatched: null,
  });
  
  const updateProgress = useCallback((currentTime, duration) => {
    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const completed = percentage >= 90;
    
    setProgress({
      time: currentTime,
      duration,
      percentage,
      completed,
      lastWatched: new Date().toISOString(),
    });
  }, [videoId, setProgress]);
  
  const clearProgress = useCallback(() => {
    setProgress({ time: 0, duration: 0, percentage: 0, completed: false, lastWatched: null });
  }, [videoId, setProgress]);
  
  return { progress, updateProgress, clearProgress };
};

export const useWatchHistory = () => {
  const [history, setHistory] = useLocalStorage('watch_history', []);
  
  const addToHistory = useCallback((video) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== video.id);
      return [{ ...video, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50);
    });
  }, [setHistory]);
  
  const removeFromHistory = useCallback((videoId) => {
    setHistory((prev) => prev.filter((h) => h.id !== videoId));
  }, [setHistory]);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);
  
  return { history, addToHistory, removeFromHistory, clearHistory };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage('favorites', []);
  
  const toggleFavorite = useCallback((video) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === video.id);
      if (exists) return prev.filter((f) => f.id !== video.id);
      return [{ ...video, addedAt: new Date().toISOString() }, ...prev];
    });
  }, [setFavorites]);
  
  const isFavorite = useCallback((videoId) => {
    return favorites.some((f) => f.id === videoId);
  }, [favorites]);
  
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, [setFavorites]);
  
  return { favorites, toggleFavorite, isFavorite, clearFavorites };
};

export const useKeyboardShortcuts = (shortcuts = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;
      
      const shortcutKey = [
        ctrl && 'ctrl',
        shift && 'shift',
        alt && 'alt',
        key,
      ].filter(Boolean).join('+');
      
      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey](event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) setHasIntersected(true);
      },
      { threshold: 0.1, ...options }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);
  
  return { ref, isIntersecting, hasIntersected };
};