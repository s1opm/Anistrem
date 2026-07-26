import { useRef, useEffect, useState } from 'react';
import { useHpfBanner } from './AdManager.jsx';

const KEY = '285dd80584e005b5ffda9e1e860ee74d';

export default function Banner300x250({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);
  const bannerRef = useHpfBanner(KEY, 300, 250);

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
    <div ref={ref} className={`flex justify-center ${className}`} style={style}>
      {visible && <div ref={bannerRef} />}
    </div>
  );
}
