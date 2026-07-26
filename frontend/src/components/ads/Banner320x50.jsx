import { useRef, useEffect, useState } from 'react';
import { useHpfBanner } from './AdManager.jsx';

const KEY = '2a437cc383cdca060c13a103e7f63f76';

export default function Banner320x50({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);
  const bannerRef = useHpfBanner(KEY, 320, 50);

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
