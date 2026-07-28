import { useEffect, useRef } from 'react';

let socialBarLoaded = false;

export default function SocialBar({ className = '' }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || socialBarLoaded) return;
    socialBarLoaded = true;
    done.current = true;

    const s = document.createElement('script');
    s.src = 'https://pl30537909.effectivecpmnetwork.com/73/b3/48/73b348d9ffc81b642c75164c25296ad8.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return <div className={className} />;
}
