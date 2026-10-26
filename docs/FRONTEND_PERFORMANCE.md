# Home page rendering performance

The guest landing page and authenticated home share the Plasma background. It now loads its WebGL renderer only on eligible desktop devices. Mobile/coarse-pointer, reduced-motion, save-data and known low-resource devices keep the existing static gradient. The desktop renderer uses one context, caps its drawing buffer at 960 x 540 and its animation at 30 FPS, and stops drawing outside the scroll viewport or while the document is hidden. Observers, listeners and the context are released on unmount.

The navigation dock uses transforms inside fixed-size slots instead of animating width/height. Full-screen ambient backgrounds are static, per-card backdrop blur was removed, and mobile navigation bars avoid backdrop filtering. Viewport-height updates are batched and only written when the height actually changes.

## Verification

From `way-esports-front/frontend`:

```bash
npm run type-check
npm run build
node scripts/check-home-performance.mjs
```

The browser check requires Node 22+ and a local Chromium, Chrome or Edge. Set `PERF_BROWSER` to its executable if it is not in a standard location. It starts a temporary local HTTP server with fixture API data; it does not test production API latency, authentication or the user's device FPS. External Telegram and font requests are blocked.

The check covers desktop buffer size/frame cap, offscreen pause/resume, document visibility events, live reduced-motion changes, and a fresh mobile navigation that must neither download the GPU module nor allocate a WebGL context. `PERF_SCREENSHOTS=1` also captures desktop and mobile screenshots. Reports are saved in the ignored `frontend/logs/performance` directory. `PERF_BASELINE=1` records an older build without enforcing the new performance requirements.

In the local 1440 x 900 / DPR 2 comparison, the drawing buffer changed from 2360 x 1342 to 885 x 503 (about 7.1 times fewer pixels per frame), context allocations from 2 to 1, and offscreen/hidden rendering to zero frames. At 390 x 844 / DPR 3, the new page allocated no WebGL context and did not download the separate ~49 KB uncompressed GPU module. These are rendering-work measurements, not a claim of a 7x faster website.

## Server update

Transfer the changed files into the existing project, including the new `src/components/UI/PlasmaCanvas.tsx`. From the directory containing `docker-compose.yml`:

```bash
docker compose up -d --build --no-deps web
```

Only the frontend image needs rebuilding. The reverse proxy already resolves the `web` service through Docker DNS with a 10-second cache. Refresh the browser after the new container is healthy. No certificate or backend changes are needed.
