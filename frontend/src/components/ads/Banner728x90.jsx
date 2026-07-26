import { useRef, useEffect, useState } from 'react';
import { useHpfBanner } from './AdManager.jsx';

const KEY = 'd2db84fcb9b95128ba93ea8bcde3146b';

export default function Banner728x90({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);
  const bannerRef = useHpfBanner(KEY, 728, 90);

  useEffect(() => {
    if (!lazyLoad || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lazyLoad]);

  return (
    <div ref={ref} className={`w-full flex justify-center ${className}`} style={style}>
      {visible && <div ref={bannerRef} />}
    </div>
  );
}
