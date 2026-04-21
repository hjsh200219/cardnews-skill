/* ============================================================
   WebGL Shader Library for Cardnews
   ------------------------------------------------------------
   사용법:
     <canvas class="shader" data-shader="gradient-flow"
             data-accent="#6C63FF" data-seed="0.3"></canvas>
     <script src="../../shared/shaders.js"></script>
     <script>CardShaders.renderAll();</script>

   셰이더 종류:
     - gradient-flow : 부드러운 메탈릭 그라디언트
     - noise-field   : 플로우 노이즈 필드
     - ring          : 동심원 링 (의미: 확장, 파급)
     - mesh          : 격자 망 (의미: 구조, 연결)
     - line-stream   : 흐르는 선 (의미: 방향, 시간)
     - orb           : 발광 구체 (의미: 포커스, 코어)
   ============================================================ */

const SHADER_SOURCES = {
  vertex: `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `,

  'gradient-flow': `
    precision highp float;
    uniform vec2 u_res;
    uniform vec3 u_accent;
    uniform float u_seed;
    float hash(vec2 p){return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      float n = noise(uv*2.5 + u_seed*10.0);
      n += noise(uv*6.0 + u_seed*20.0)*0.5;
      n = smoothstep(0.2, 0.9, n);
      vec3 col = mix(vec3(1.0), u_accent, n*0.85);
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'noise-field': `
    precision highp float;
    uniform vec2 u_res;
    uniform vec3 u_accent;
    uniform float u_seed;
    float hash(vec2 p){return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
      vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p){
      float v=0.0, a=0.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
      return v;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      float n = fbm(uv*3.0 + u_seed*5.0);
      float mask = smoothstep(0.35, 0.8, n);
      vec3 col = mix(vec3(1.0), u_accent, mask*0.8);
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'ring': `
    precision highp float;
    uniform vec2 u_res;
    uniform vec3 u_accent;
    uniform float u_seed;
    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
      float d = length(uv);
      float rings = 0.0;
      for(int i=0;i<6;i++){
        float r = 0.12 + float(i)*0.1 + u_seed*0.03;
        float w = 0.004 + float(i)*0.001;
        rings += smoothstep(w, 0.0, abs(d-r));
      }
      rings = clamp(rings, 0.0, 1.0);
      vec3 col = mix(vec3(1.0), u_accent, rings*0.9);
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'mesh': `
    precision highp float;
    uniform vec2 u_res;
    uniform vec3 u_accent;
    uniform float u_seed;
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      vec2 g = fract(uv*12.0 + u_seed) - 0.5;
      float dot_ = smoothstep(0.08, 0.02, length(g));
      vec2 g2 = fract(uv*12.0 + u_seed);
      float line = 0.0;
      line += smoothstep(0.02, 0.0, min(g2.x, 1.0-g2.x))*0.3;
      line += smoothstep(0.02, 0.0, min(g2.y, 1.0-g2.y))*0.3;
      float fade = smoothstep(1.0, 0.3, length(uv-0.5)*2.0);
      float alpha = (dot_ + line) * fade;
      vec3 col = mix(vec3(1.0), u_accent, alpha*0.85);
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'line-stream': `
    precision highp float;
    uniform vec2 u_res;
    uniform vec3 u_accent;
    uniform float u_seed;
    float hash(float n){return fract(sin(n)*43758.5453);}
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      float val = 0.0;
      for(int i=0;i<14;i++){
        float fi = float(i);
        float y = hash(fi + u_seed*7.0);
        float thick = 0.002 + hash(fi+1.3)*0.004;
        float offset = sin(uv.x*3.14159 + fi + u_seed*4.0)*0.08;
        float d = abs(uv.y - y - offset);
        val += smoothstep(thick, 0.0, d);
      }
      val = clamp(val, 0.0, 1.0);
      vec3 col = mix(vec3(1.0), u_accent, val*0.8);
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'orb': `
    precision highp float;
    uniform vec2 u_res;
    uniform vec3 u_accent;
    uniform float u_seed;
    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
      vec2 offset = vec2(sin(u_seed*6.28)*0.2, cos(u_seed*6.28)*0.15);
      float d = length(uv - offset);
      float core = smoothstep(0.15, 0.0, d);
      float halo = smoothstep(0.6, 0.15, d)*0.5;
      float glow = core + halo;
      vec3 col = mix(vec3(1.0), u_accent, glow);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

function hexToRgb(hex) {
  const h = hex.replace('#','');
  const v = h.length === 3
    ? h.split('').map(c => parseInt(c+c, 16))
    : [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  return v.map(x => x/255);
}

function renderShader(canvas) {
  const type = canvas.dataset.shader || 'gradient-flow';
  const accent = canvas.dataset.accent || '#6C63FF';
  const seed = parseFloat(canvas.dataset.seed || '0.5');

  const dpr = 2;
  canvas.width  = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  const glOpts = { preserveDrawingBuffer: true, antialias: true, premultipliedAlpha: false };
  const gl = canvas.getContext('webgl', glOpts) || canvas.getContext('experimental-webgl', glOpts);
  if (!gl) { console.error('WebGL unavailable on', canvas); return; }

  const fragSrc = SHADER_SOURCES[type];
  if (!fragSrc) { console.error('Unknown shader:', type); return; }

  function compile(srcType, src) {
    const s = gl.createShader(srcType);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, SHADER_SOURCES.vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(gl.getUniformLocation(prog, 'u_res'), canvas.width, canvas.height);
  gl.uniform3f(gl.getUniformLocation(prog, 'u_accent'), ...hexToRgb(accent));
  gl.uniform1f(gl.getUniformLocation(prog, 'u_seed'), seed);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();

  // WebGL 캔버스를 PNG dataURL로 변환 후 <img>로 교체
  // (Playwright element.screenshot()이 WebGL 합성을 누락하는 이슈 우회)
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    img.style.objectFit = 'cover';
    img.className = 'shader-rendered';
    canvas.parentNode.replaceChild(img, canvas);
    img.dataset.rendered = 'true';
  } catch (e) {
    console.error('toDataURL failed:', e);
    canvas.dataset.rendered = 'true';
  }
}

window.CardShaders = {
  renderAll() {
    document.querySelectorAll('canvas.shader').forEach(renderShader);
    window.__shadersReady = true;
  },
  render: renderShader,
};
