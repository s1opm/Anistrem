import { useEffect, useRef } from 'react';

const loadedScripts = new Map();
const initialized = {
  socialBar: false,
  popunder: false,
};

export function useAdScript(id, src, attrs = {}) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (loadedScripts.has(id)) {
      initializedRef.current = true;
      return;
    }

    if (!document.getElementById(id) && src) {
      const script = document.createElement('script');
      script.id = id;
      script.async = true;
      Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
      if (src) script.src = src;
      document.head.appendChild(script);
      loadedScripts.set(id, true);
    }
    initializedRef.current = true;
  }, [id, src]);
}

export function usePopunderInit(src) {
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current || initialized.popunder || !src) return;
    initialized.popunder = true;
    ref.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }, [src]);
}

export function useSocialBarInit(src) {
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current || initialized.socialBar || !src) return;
    initialized.socialBar = true;
    ref.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }, [src]);
}

export function AdProvider({ children }) {
  return <>{children}</>;
}
