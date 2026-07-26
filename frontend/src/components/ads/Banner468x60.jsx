import { useRef, useEffect, useState } from 'react';
import { useHpfBanner } from './AdManager.jsx';

const KEY = 'c19d16e7abb67975a063244d664a75c4';

export default function Banner468x60({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);
  const bannerRef = useHpfBanner(KEY, 468, 60);

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
