import { useRef, useEffect, useState } from 'react';

export default function Banner160x300({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);

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
      {visible && (
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '160px', height: '300px' }}
          data-ad-client=""
          data-ad-slot=""
        />
      )}
    </div>
  );
}
