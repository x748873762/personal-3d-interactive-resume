import { useEffect, useRef, useState } from 'react';
import { chapters } from '../content';
export function Artwork({ type }) {
  return <div className={`artwork art-${type}`} aria-hidden="true"><i/><b/><span/><em/></div>;
}
export default function Gallery({ onPreview }) {
  const rail = useRef(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const el = rail.current;
    const wheel = e => {
      if (!matchMedia('(min-width: 841px) and (prefers-reduced-motion: no-preference)').matches || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft > 1) || (e.deltaY > 0 && el.scrollLeft < max - 1)) {
        e.preventDefault(); el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  function jump(next, instant = false) {
    const el = rail.current, target = el.children[Math.max(0, Math.min(chapters.length - 1, next))];
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <section id="gallery" tabIndex={-1} className="gallery-section" aria-labelledby="gallery-title">
    <div className="section-top"><div><p className="section-index">02 / 纸上展览</p><h2 id="gallery-title">一些形状，<br/>一些想象。</h2></div><div className="gallery-tools"><span aria-live="polite" data-testid="gallery-count">{String(index + 1).padStart(2, '0')} / 05</span><button aria-label="上一个作品" disabled={index === 0} onClick={() => jump(index - 1)}>←</button><button aria-label="下一个作品" disabled={index === 4} onClick={() => jump(index + 1)}>→</button></div></div>
    <p className="gallery-hint">滚动浏览，或使用方向按钮。点击纸张展开。</p>
    <div className="gallery-rail" ref={rail} tabIndex={0} aria-label="作品画廊" onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); jump(index + (e.key === 'ArrowRight' ? 1 : -1)); } }} onScroll={() => { const el = rail.current; setIndex(Math.round(el.scrollLeft / (el.children[1].offsetLeft - el.children[0].offsetLeft))); }}>
      {chapters.map((item, i) => <button className="gallery-card paper" key={item.label} onClick={() => { jump(i, true); onPreview(item); }} aria-label={`预览${item.project}`}><Artwork type={item.art}/><div className="art-caption"><span>练习 {String(i + 1).padStart(2, '0')}</span><h3>{item.project}</h3><span className="art-arrow">↗</span></div></button>)}
    </div>
  </section>;
}
