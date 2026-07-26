import { useEffect, useRef, useState } from 'react';

const loadedScripts = new Set();

export function useScriptOnce(id, src) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || loadedScripts.has(id)) {
      done.current = true;
      return;
    }
    if (!src) return;
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
    loadedScripts.add(id);
    done.current = true;
  }, [id, src]);
}

let instanceCounter = 0;

export function useHpfBanner(key, width, height) {
  const containerRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || rendered) return;
    setRendered(true);

    const iframe = document.createElement('iframe');
    iframe.width = width;
    iframe.height = height;
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.src = 'about:blank';
    el.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html><head></head><body style="margin:0;padding:0;overflow:hidden;">
      <script>
      var atOptions = {
        key : '${key}',
        format : 'iframe',
        height : ${height},
        width : ${width},
        params : {}
      };
      </script>
      <script async src="https://www.highperformanceformat.com/${key}/invoke.js"></script>
      </body></html>
    `);
    doc.close();
  }, [key, width, height, rendered]);

  return containerRef;
}
