import { useEffect, useRef, useState } from 'react';

// Fades an element in once when it scrolls into view. Used on a few key blocks only.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`${className} ${shown ? 'animate-rise' : 'opacity-0'}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
