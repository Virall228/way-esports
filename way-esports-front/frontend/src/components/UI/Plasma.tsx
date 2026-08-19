import React, { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';

export interface PlasmaProps {
  className?: string;
  color?: string;
  speed?: number;
  direction?: 'forward' | 'reverse' | 'pingpong';
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  enabled?: boolean;
}

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

  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;
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

  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
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
    if (!enabled || !containerRef.current || typeof window === 'undefined') {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2')) {
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
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        webgl: 2
      });
    } catch (error) {
      console.warn('Plasma renderer init failed:', error);
      return;
    }

    const gl = renderer.gl;
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
      mouse[0] = event.clientX - rect.left;
      mouse[1] = event.clientY - rect.top;
    };

    const setSize = () => {
      if (!renderer) return;
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);

      const resolution = program.uniforms.iResolution.value as Float32Array;
      resolution[0] = gl.drawingBufferWidth;
      resolution[1] = gl.drawingBufferHeight;
    };

    if (mouseInteractive) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    setSize();

    const startedAt = performance.now();
    const loop = (timestamp: number) => {
      if (destroyed || !renderer) return;

      const elapsed = (timestamp - startedAt) * 0.001;

      if (direction === 'pingpong') {
        const duration = 10;
        const segment = elapsed % (duration * 2);
        program.uniforms.iTime.value = segment > duration ? duration * 2 - segment : segment;
      } else {
        program.uniforms.iTime.value = elapsed;
      }

      renderer.render({ scene: mesh });
      animationFrame = window.requestAnimationFrame(loop);
    };

    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();

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
