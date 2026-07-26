import { useRef, useEffect, useState } from 'react';
import { useScriptOnce } from './AdManager.jsx';

const SCRIPT_SRC = 'https://pl30537907.effectivecpmnetwork.com/98c95932bc57756b4db168872a06dfd9/invoke.js';
const CONTAINER_ID = 'container-98c95932bc57756b4db168872a06dfd9';

export default function NativeBanner({ className = '', style = {}, lazyLoad = true }) {
  const ref = useRef(null);
  const adRef = useRef(null);
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

  useEffect(() => {
    if (!visible || !adRef.current) return;

    const existing = document.getElementById(CONTAINER_ID);
    if (existing) return;

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    adRef.current.appendChild(container);

    const s = document.createElement('script');
    s.async = true;
    s.src = SCRIPT_SRC;
    document.body.appendChild(s);
  }, [visible]);

  return (
    <div ref={ref} className={`w-full my-6 ${className}`} style={style}>
      <div ref={adRef} />
    </div>
  );
}
