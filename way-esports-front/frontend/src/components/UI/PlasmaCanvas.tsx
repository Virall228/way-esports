import React, { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';

import type { PlasmaProps } from './Plasma';

const vertexShader = `#version 300 es
precision highp float;

in vec2 position;
in vec2 uv;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;

out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);

  float i = 0., d = 0., z = 0., T = iTime * uSpeed * uDirection;
  vec3 O = vec3(0.), p, S;
  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w / d * o.xyz) {
    p = z * normalize(vec3(C - .5 * r, r.y));
    p.z -= 4.;
    S = p;
    d = p.y - T;

    p.x += .4 * (1. + p.y) * sin(d + p.x * 0.1) * cos(.34 * d + p.x * 0.05);
    Q = p.xz *= mat2(cos(p.y + vec4(0, 11, 33, 0) - T));
    z += d = abs(sqrt(length(Q * Q)) - .25 * (5. + S.y)) / 3. + 8e-4;
    o = 1. + sin(S.y + p.z * .5 + S.z - length(S - p) + vec4(2, 1, 0, 8));
  }

  o.xyz = tanh(O / 1e4);
}

bool finite1(float x) {
  return !(isnan(x) || isinf(x));
}

vec3 sanitize(vec3 c) {
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);

  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));

  float alpha = clamp(length(rgb) * uOpacity, 0.0, 1.0);
  // Match the renderer's premultiplied-alpha canvas without a conversion pass.
  fragColor = vec4(finalColor * alpha, alpha);
}
`;

const fallbackColor: [number, number, number] = [245 / 255, 154 / 255, 74 / 255];

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.trim();
  const shortMatch = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(normalized);

  if (shortMatch) {
    return [
      parseInt(shortMatch[1] + shortMatch[1], 16) / 255,
      parseInt(shortMatch[2] + shortMatch[2], 16) / 255,
      parseInt(shortMatch[3] + shortMatch[3], 16) / 255
    ];
  }

  const fullMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  if (!fullMatch) return fallbackColor;

  return [
    parseInt(fullMatch[1], 16) / 255,
    parseInt(fullMatch[2], 16) / 255,
    parseInt(fullMatch[3], 16) / 255
  ];
};

const Plasma: React.FC<PlasmaProps> = ({
  className,
  color = '#f59a4a',
  speed = 0.75,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = true,
  enabled = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const customColorRgb = hexToRgb(color);
    const directionMultiplier = direction === 'reverse' ? -1 : 1;

    let renderer: Renderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let animationFrame = 0;
    let destroyed = false;

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        // Soft backgrounds do not need Retina-sized drawing buffers.
        dpr: 1,
        powerPreference: 'low-power',
        webgl: 2
      });
    } catch (error) {
      console.warn('Plasma renderer init failed:', error);
      return;
    }

    const gl = renderer.gl;
    if (typeof WebGL2RenderingContext === 'undefined' || !(gl instanceof WebGL2RenderingContext)) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: 1 },
        uSpeed: { value: speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: { value: mouseInteractive ? 1 : 0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseInteractive) return;
      const rect = container.getBoundingClientRect();
      const mouse = program.uniforms.uMouse.value as Float32Array;
      mouse[0] = (event.clientX - rect.left) * gl.drawingBufferWidth / Math.max(1, rect.width);
      mouse[1] = (rect.bottom - event.clientY) * gl.drawingBufferHeight / Math.max(1, rect.height);
    };

    const setSize = () => {
      if (!renderer) return;
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const renderScale = Math.min(0.75, 960 / width, 540 / height);
      const renderWidth = Math.max(1, Math.round(width * renderScale));
      const renderHeight = Math.max(1, Math.round(height * renderScale));
      if (canvas.width === renderWidth && canvas.height === renderHeight) return;
      renderer.setSize(renderWidth, renderHeight);
      // OGL also sets inline CSS dimensions; stretch the smaller buffer to fit.
      canvas.style.width = '100%';
      canvas.style.height = '100%';

      const resolution = program.uniforms.iResolution.value as Float32Array;
      resolution[0] = gl.drawingBufferWidth;
      resolution[1] = gl.drawingBufferHeight;
      const mouse = program.uniforms.uMouse.value as Float32Array;
      mouse[0] = resolution[0] / 2;
      mouse[1] = resolution[1] / 2;
    };

    if (mouseInteractive) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();

    const frameInterval = 1000 / 30;
    let lastFrame = 0;
    let elapsed = 0;
    let inView = !('IntersectionObserver' in window);
    const loop = (timestamp: number) => {
      animationFrame = 0;
      if (destroyed || !renderer) return;
      if (document.hidden || !inView) return;

      animationFrame = window.requestAnimationFrame(loop);
      const delta = lastFrame ? timestamp - lastFrame : frameInterval;
      if (delta < frameInterval) return;
      elapsed += Math.min(delta - (delta % frameInterval), 100) * 0.001;
      lastFrame = timestamp - (delta % frameInterval);

      if (direction === 'pingpong') {
        const duration = 10;
        const segment = elapsed % (duration * 2);
        program.uniforms.iTime.value = segment > duration ? duration * 2 - segment : segment;
      } else {
        program.uniforms.iTime.value = elapsed;
      }

      renderer.render({ scene: mesh });
    };

    const syncPlayback = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      lastFrame = 0;
      if (!destroyed && inView && !document.hidden) {
        animationFrame = window.requestAnimationFrame(loop);
      }
    };
    const intersectionObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          syncPlayback();
        })
      : null;
    intersectionObserver?.observe(container);
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);

      if (mouseInteractive) {
        container.removeEventListener('mousemove', handleMouseMove);
      }

      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }

      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color, direction, enabled, mouseInteractive, opacity, scale, speed]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
};

export default Plasma;
