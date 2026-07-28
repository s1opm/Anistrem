import { useRef, useEffect, useState } from 'react';

let nativeLoaded = false;

export default function NativeBanner({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const adRef = useRef(null);
  const [visible, setVisible] = useState(!lazyLoad);
  const containerIdRef = useRef(`native-ad-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (!lazyLoad || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lazyLoad]);

  useEffect(() => {
    if (!visible || !adRef.current) return;

    const existing = document.getElementById(containerIdRef.current);
    if (existing) return;

    const container = document.createElement('div');
    container.id = containerIdRef.current;
    adRef.current.appendChild(container);

    if (!nativeLoaded) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://pl30537907.effectivecpmnetwork.com/98c95932bc57756b4db168872a06dfd9/invoke.js';
      document.body.appendChild(s);
      nativeLoaded = true;
    }
  }, [visible]);

  return (
    <div ref={ref} className={`w-full my-6 ${className}`} style={style}>
      <div ref={adRef} />
    </div>
  );
}
