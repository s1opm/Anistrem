import { useRef, useEffect, useState } from 'react';
import { useHpfBanner } from './AdManager.jsx';

const KEY = '8e61c89c19e603cf3a11eda2a3e340eb';

export default function Banner160x300({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);
  const bannerRef = useHpfBanner(KEY, 160, 300);

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
