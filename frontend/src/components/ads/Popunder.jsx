import { useEffect, useRef } from 'react';

let popunderLoaded = false;

export default function Popunder() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || popunderLoaded) return;
    popunderLoaded = true;
    done.current = true;

    const s = document.createElement('script');
    s.src = 'https://pl30537906.effectivecpmnetwork.com/b1/14/2f/b1142f4289fd1652797deeadb84c9063.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return null;
}
