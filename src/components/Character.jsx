import { useEffect, useRef, useState } from 'react';

export default function Character({ active, home, theme }) {
  const host = useRef(null);
  const state = useRef({ active, home, theme });
  const [ready, setReady] = useState(false);
  useEffect(() => { state.current = { active, home, theme }; }, [active, home, theme]);
  useEffect(() => {
    const media = matchMedia('(min-width: 841px) and (prefers-reduced-motion: no-preference)');
    let stop = () => {}, disposed = false;
    async function setup() {
      stop(); setReady(false);
      if (!media.matches) return;
      let cancelled = false;
      stop = () => { cancelled = true; };
      const THREE = await import('three');
      if (cancelled || disposed) return;
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
      catch { return; }
      const el = host.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
      camera.position.set(0, .4, 9);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
      el.appendChild(renderer.domElement);
      const group = new THREE.Group(); scene.add(group);
      const body = new THREE.MeshStandardMaterial({ color: '#b5b1a9', roughness: .68, metalness: .12 });
      const dark = new THREE.MeshStandardMaterial({ color: '#25272b', roughness: .4 });
      const white = new THREE.MeshStandardMaterial({ color: '#f4e8cd', roughness: .5 });
      const add = (geometry, material, x, y, z) => {
        const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); group.add(mesh); return mesh;
      };
      add(new THREE.CapsuleGeometry(.73, .92, 12, 40), body, 0, -.7, 0);
      add(new THREE.SphereGeometry(.86, 48, 32), body, 0, .87, 0);
      const pupils = [];
      [-.28, .28].forEach(x => {
        add(new THREE.SphereGeometry(.23, 24, 20), white, x, 1.01, .77);
        pupils.push(add(new THREE.SphereGeometry(.095, 20, 16), dark, x, 1.01, .973));
        const arm = add(new THREE.CapsuleGeometry(.21, .68, 8, 20), body, Math.sign(x) * .95, -.66, 0);
        arm.rotation.z = Math.sign(x) * .17;
        add(new THREE.CapsuleGeometry(.26, .36, 8, 20), dark, Math.sign(x) * .36, -1.75, .06);
      });
      add(new THREE.TorusGeometry(.17, .027, 8, 30, Math.PI), dark, 0, .61, .819).rotation.z = Math.PI;
      scene.add(new THREE.HemisphereLight('#fffaee', '#636773', 3));
      const light = new THREE.DirectionalLight('#ffffff', 4); light.position.set(-3, 5, 4); scene.add(light);
      const rim = new THREE.DirectionalLight('#f7bd65', 2); rim.position.set(4, 2, -3); scene.add(rim);
      let pointer = { x: 0, y: 0 }, frame;
      const move = e => { pointer = { x: (e.clientX / innerWidth - .5) * 2, y: -(e.clientY / innerHeight - .5) * 2 }; };
      const reset = () => { pointer = { x: 0, y: 0 }; };
      const resize = () => { const r = el.getBoundingClientRect(); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); renderer.setSize(r.width, r.height); };
      const observer = new ResizeObserver(resize); observer.observe(el); resize();
      window.addEventListener('pointermove', move); document.addEventListener('pointerleave', reset); window.addEventListener('blur', reset);
      let visible = true;
      const render = () => {
        const s = state.current;
        const yaw = s.home ? pointer.x * .1 : (s.active - 2) * .09;
        group.rotation.y += (yaw - group.rotation.y) * .06;
        const y = s.home ? 0 : .2 + s.active * .045;
        camera.position.y += (y - camera.position.y) * .05;
        camera.position.z += ((s.home ? 8.8 : 7.6) - camera.position.z) * .05;
        camera.lookAt(0, 0, 0);
        pupils.forEach((p, i) => { p.position.x = (i ? .28 : -.28) + (s.home ? pointer.x * .055 : 0); p.position.y = 1.01 + (s.home ? pointer.y * .055 : 0); });
        renderer.render(scene, camera);
        if (visible) frame = requestAnimationFrame(render);
      };
      const visibility = new IntersectionObserver(([entry]) => {
        const was = visible; visible = entry.isIntersecting;
        if (visible && !was) render();
      });
      visibility.observe(el); render(); setReady(true);
      stop = () => {
        cancelled = true; cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect();
        window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', reset); window.removeEventListener('blur', reset);
        scene.traverse(obj => obj.geometry?.dispose()); body.dispose(); dark.dispose(); white.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
    }
    setup(); media.addEventListener('change', setup);
    return () => { disposed = true; stop(); media.removeEventListener('change', setup); };
  }, []);
  return <div className={`character ${ready ? 'is-live' : 'is-static'}`} aria-label="原创几何角色：圆点" role="img">
    <div className="character-canvas" ref={host} />
    <div className="static-character" aria-hidden="true"><div className="robot-head"><i/><i/><b/></div><div className="robot-body"/><div className="robot-feet"/></div>
  </div>;
}
