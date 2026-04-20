import { useEffect, useRef } from 'react';

export default function InfiniteScrollSentinel({ onVisible, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisible(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, disabled]);

  return <div ref={ref} style={{ height: 1 }} />;
}
