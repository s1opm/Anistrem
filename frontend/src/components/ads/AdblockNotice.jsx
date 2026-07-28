import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdblockNotice() {
  const [blocked, setBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const baitRef = useRef(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    const bait = document.createElement('div');
    bait.className = 'ad-unit ad-banner adsbygoogle pub_300x250';
    bait.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;pointer-events:none;opacity:0';
    document.body.appendChild(bait);
    baitRef.current = bait;

    const check = () => {
      if (!bait || bait.offsetParent === null || bait.offsetHeight === 0 || bait.offsetWidth === 0 || bait.clientHeight === 0 || bait.clientWidth === 0) {
        const rect = bait.getClientRects();
        if (!rect || rect.length === 0) {
          setBlocked(true);
        }
      }
    };

    const timer = setTimeout(check, 2000);

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://potterynaggingformerly.com/b1/14/2f/b1142f4289fd1652797deeadb84c9063.js';
    s.onerror = () => {};
    s.onload = () => { scriptLoaded.current = true; };
    document.body.appendChild(s);

    return () => {
      clearTimeout(timer);
      bait.remove();
    };
  }, []);

  return (
    <AnimatePresence>
      {blocked && !dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-dark-900 border border-dark-600 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ad Blocker Detected</h2>
            <p className="text-dark-300 text-sm mb-6 leading-relaxed">
              We understand you value your privacy. Our site relies on advertising to provide free content. Please disable your ad blocker for this site to continue enjoying unlimited anime streaming.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setDismissed(true)}
                className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
              >
                I've Disabled My Ad Blocker
              </button>
              <button
                onClick={() => { setDismissed(true); }}
                className="w-full py-2 px-4 text-dark-400 hover:text-white text-sm transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
