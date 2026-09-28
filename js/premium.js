/* Payoff — premium layer (v14)
   1. Ember gradient: live WebGL shader behind the teardown section (ShaderGradient-style, no libraries).
   2. Unicorn Studio: loads only when an element has a non-empty data-us-project="…".
   3. Rive: loads only when an element has a non-empty data-rive="file.riv".
   Everything respects prefers-reduced-motion and Save-Data, pauses off-screen, and falls back to CSS. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const small = matchMedia('(max-width: 860px)').matches;
  const onIdle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  const whenNear = (el, fn, margin = '300px') => {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
    io.observe(el);
  };

  /* ---------- 1. Ember gradient ---------- */
  function ember(host) {
    const cv = document.createElement('canvas');
    cv.className = 'ember'; cv.setAttribute('aria-hidden', 'true');
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl) return; // CSS gradient fallback stays
    const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*1.5;float T=t*.04;
 vec2 q=vec2(fbm(p+T),fbm(p+vec2(5.2,1.3)-T));
 vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+T*1.3),fbm(p+3.*q+vec2(8.3,2.8)-T));
 float f=fbm(p+2.4*w);
 vec3 deep=vec3(.60,.090,.012),red=vec3(.835,.133,.016),ember=vec3(.88,.24,.05),ink=vec3(.26,.045,.02);
 vec3 c=mix(deep,red,smoothstep(.28,.72,f));
 c=mix(c,ember,smoothstep(.62,1.,length(w))*.5);
 c=mix(c,ink,smoothstep(.5,.92,q.y)*.4);
 c+=vec3(.10,.035,0.)*smoothstep(.5,0.,distance(uv,m));
 c*=mix(.8,1.,smoothstep(1.15,.25,distance(uv,vec2(.62,.55))));
 gl_FragColor=vec4(c,1.);}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uM = gl.getUniformLocation(pr, 'm');

    host.prepend(cv);
    const scale = small ? .35 : .5; // soft gradient: half-res is invisible, and cheap
    const size = () => { const b = host.getBoundingClientRect(); cv.width = Math.max(2, Math.round(b.width * scale)); cv.height = Math.max(2, Math.round(b.height * scale)); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height); };
    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(host); else addEventListener('resize', size);

    const m = { x: .7, y: .5, tx: .7, ty: .5 };
    host.addEventListener('pointermove', e => { const b = host.getBoundingClientRect(); m.tx = (e.clientX - b.left) / b.width; m.ty = 1 - (e.clientY - b.top) / b.height; }, { passive: true });

    const t0 = performance.now() - 20000; // start mid-flow, not at a flat frame
    const draw = now => { m.x += (m.tx - m.x) * .05; m.y += (m.ty - m.y) * .05; gl.uniform2f(uM, m.x, m.y); gl.uniform1f(uT, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    draw(performance.now());
    requestAnimationFrame(() => host.classList.add('ember-on'));
    if (reduce || saveData) return; // one still frame only

    let run = false, raf = 0, last = 0;
    const loop = now => { raf = requestAnimationFrame(loop); if (now - last < 33) return; last = now; draw(now); }; // ~30fps is plenty for a slow drift
    const set = on => { if (on === run) return; run = on; if (on) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf); };
    let vis = false;
    new IntersectionObserver(es => { vis = es[0].isIntersecting; set(vis && !document.hidden); }).observe(host);
    document.addEventListener('visibilitychange', () => set(vis && !document.hidden));
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); set(false); cv.remove(); host.classList.remove('ember-on'); });
  }
  const tear = document.getElementById('teardown');
  if (tear) whenNear(tear, () => ember(tear), '600px');

  /* ---------- 2. Unicorn Studio ---------- */
  const US_SRC = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.3.0/dist/unicornStudio.umd.js';
  const usEls = [...document.querySelectorAll('[data-us-project]')].filter(el => el.dataset.usProject.trim());
  if (usEls.length && !reduce && !saveData) {
    usEls.forEach(el => { el.dataset.usProduction = 'true'; el.dataset.usLazyload = 'true'; if (small && !el.dataset.usScale) el.dataset.usScale = '.5'; });
    whenNear(usEls[0], () => loadScript(US_SRC).then(() => window.UnicornStudio && UnicornStudio.init())
      .then(() => usEls.forEach(el => el.classList.add('us-on'))).catch(() => {}), '500px');
  }

  /* ---------- 3. Rive ---------- */
  const RIVE_SRC = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.43.1/rive.js';
  const rvEls = [...document.querySelectorAll('[data-rive]')].filter(el => el.dataset.rive.trim());
  if (rvEls.length && !saveData) {
    let lib = null;
    const getLib = () => lib || (lib = loadScript(RIVE_SRC).then(() => window.rive));
    rvEls.forEach(el => whenNear(el, () => getLib().then(R => {
      const cv = document.createElement('canvas'); cv.className = 'rive-cv'; cv.setAttribute('aria-hidden', 'true');
      el.prepend(cv);
      const sm = el.dataset.riveSm || 'State Machine 1';
      const r = new R.Rive({
        src: el.dataset.rive, canvas: cv, autoplay: !reduce, stateMachines: sm,
        layout: new R.Layout({ fit: R.Fit[el.dataset.riveFit || 'Contain'], alignment: R.Alignment.Center }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas(); el.classList.add('rive-on');
          const hov = el.dataset.riveHover; // name of a boolean input driven by hovering the host element
          const inp = hov && (r.stateMachineInputs(sm) || []).find(i => i.name === hov);
          if (inp) { el.addEventListener('pointerenter', () => { inp.value = true; }); el.addEventListener('pointerleave', () => { inp.value = false; }); el.addEventListener('focusin', () => { inp.value = true; }); el.addEventListener('focusout', () => { inp.value = false; }); }
        },
        onLoadError: () => cv.remove()
      });
      addEventListener('resize', () => r.resizeDrawingSurfaceToCanvas(), { passive: true });
    }).catch(() => {}), '200px'));
  }
})();
