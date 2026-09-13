import { useEffect, useRef, useState } from 'react';
import Character from './components/Character';
import Gallery, { Artwork } from './components/Gallery';
import { capabilities, chapters } from './content';

function go(event, id) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  history.pushState(null, '', `#${id}`);
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
function Chapter({ item, index, onPreview }) {
  const [flipped, setFlipped] = useState(false);
  return <section className="chapter" id={`chapter-${index}`} tabIndex={-1} aria-label={`${item.label}叙事`}>
    <article className={`story-paper paper ${flipped ? 'is-flipped' : ''}`}>
      <div key={String(flipped)} className="page-content">
        <div className="paper-meta"><span>纸间手记 / {item.label}</span><span>0{index + 1}</span></div>
        <p className="handwritten">{flipped ? '把想法变成小小的练习' : '一个完全虚构的小故事'}</p>
        <h2>{flipped ? item.project : item.title}</h2>
        <p className="story-copy">{flipped ? item.detail : item.text}</p>
        {flipped ? <button className="inline-preview" onClick={() => onPreview(item)} aria-label="打开项目预览"><Artwork type={item.art}/><span>展开这张纸 ↗</span></button> : <div className="story-rule" aria-hidden="true"><span>○</span><i/><span>✳</span></div>}
      </div>
      <div className="paper-footer"><span>{flipped ? '02' : '01'} / 02</span><button className="text-button" aria-expanded={flipped} onClick={() => setFlipped(value => !value)}>{flipped ? '← 返回叙事' : '查看项目 →'}</button></div>
    </article>
  </section>;
}
function Preview({ item, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    el.showModal(); document.body.style.overflow = 'hidden';
    return () => { el.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="preview" aria-labelledby="preview-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); } }}>
    <button className="close-preview" onClick={onClose} aria-label="关闭预览" autoFocus>×</button><Artwork type={item.art}/><div className="preview-copy"><p>虚构作品 · 原创几何图形</p><h2 id="preview-title">{item.project}</h2><p>{item.detail}</p><small>按 Escape 或点击背景关闭</small></div>
  </dialog>;
}
export default function App() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('paper-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } });
  const [active, setActive] = useState(0);
  const [home, setHome] = useState(true);
  const [preview, setPreview] = useState(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('paper-theme', theme); } catch { /* Storage can be disabled; the current theme still works. */ } }, [theme]);
  useEffect(() => {
    let frame;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setHome(scrollY < innerHeight * .5);
        const sections = [...document.querySelectorAll('.chapter')];
        let best = 0, distance = Infinity;
        sections.forEach((el, i) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - innerHeight / 2); if (d < distance) { best = i; distance = d; } });
        setActive(best);
      });
    }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <>
    <a className="skip-link" href="#chapter-0" onClick={e => go(e, 'chapter-0')}>跳到叙事内容</a>
    <header className="site-header"><a className="wordmark" href="#home" onClick={e => go(e, 'home')}>纸间<span>纸与形状的游乐场</span></a><div className="theme-controls" role="group" aria-label="主题切换">{[['dark', '红黑'], ['light', '暖灰']].map(([id, name]) => <button key={id} onClick={() => setTheme(id)} aria-label={`切换${name}主题`} aria-pressed={theme === id}><i className={`arcade ${id}`}/><span>{name}</span></button>)}</div></header>
    <main>
      <div className="narrative">
        <div className={`stage ${home ? 'at-home' : 'in-story'}`}><Character active={active} home={home} theme={theme}/><div className="role-notes" aria-label="五段叙事">{chapters.map((item, i) => <a key={item.label} href={`#chapter-${i}`} onClick={e => go(e, `chapter-${i}`)} className={`paper role-note note-${i}`} aria-current={!home && active === i ? 'step' : undefined}><small>0{i + 1}</small>{item.label}<span>↗</span></a>)}</div><span className="character-caption">圆点 / 几何世界的虚构居民</span></div>
        <section id="home" className={`hero ${home ? "" : "is-away"}`} tabIndex={-1}>
          <div className="hero-copy"><h1>把想法，<br/><em>贴在纸上。</em></h1><p>一个角色，五张便签。<br/>在滚动与翻页之间，探索纸张里的小小世界。</p><span className="fiction-note">纯属虚构 · 自由想象</span></div>
          <nav className="paper-navigation" aria-label="页面导航" hidden={!home}>{[['chapter-0', '叙事'], ['gallery', '画廊'], ['capabilities', '能力'], ['ending', '尾声']].map(([id, name], i) => <a className={`paper nav-note nav-${i}`} key={id} href={`#${id}`} onClick={e => go(e, id)}>{name}<span>↗</span></a>)}</nav>
          <a className="scroll-note" href="#chapter-0" onClick={e => go(e, 'chapter-0')}><i aria-hidden="true">↓</i><span>向下滚动，翻开故事</span></a><span className="hero-corner">无需真实身份，故事也可以开始。</span>
        </section>
        <div className="chapters">{chapters.map((item, index) => <Chapter key={item.label} item={item} index={index} onPreview={setPreview}/>)}</div>
      </div>
      <Gallery onPreview={setPreview}/>
      <section id="capabilities" className="capabilities" tabIndex={-1}><p className="section-index">03 / 五张小纸条</p><h2>好的表达，<br/>从简单开始。</h2><div className="capability-notes">{capabilities.map((text, index) => <article className="paper capability" key={text} tabIndex={0}><span>0{index + 1}</span><h3>{text}</h3><p>{['先看见重点，再慢慢发现细节。', '给内容空间，也给视线方向。', '每一次操作，都有清楚的回应。', '用适量的变化，串起阅读过程。', '留下可以读懂、继续改写的故事。'][index]}</p></article>)}</div></section>
      <footer id="ending" className="ending" tabIndex={-1}><p className="section-index">04 / 故事未完</p><h2>下一张纸，<br/><em>留给你的想法。</em></h2><p>这是一个通用交互示例。<br/>角色、叙事与作品均为虚构。</p><a className="paper ending-note" href="#home" onClick={e => go(e, 'home')}>回到第一页 <span>↑</span></a><div className="footer-line"><span>纸间 / 交互模板</span><span>用简单的形状，装下新的想象。</span></div></footer>
    </main>
    {!home && <a className="back-home paper" href="#home" onClick={e => go(e, 'home')} aria-label="返回首屏">↑<span>首屏</span></a>}
    {preview && <Preview item={preview} onClose={() => setPreview(null)}/>}
  </>;
}
