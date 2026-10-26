import React, { Suspense, lazy, useEffect, useState } from 'react';

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

// Keep the GPU renderer out of the mobile/reduced-motion page download.
const PlasmaCanvas = lazy(() => import('./PlasmaCanvas'));

const Plasma: React.FC<PlasmaProps> = (props) => {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px), (pointer: coarse)');
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const limitedDevice = (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
      || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
      || Boolean(device.connection?.saveData);
    const sync = () => setCanAnimate(!media.matches && !limitedDevice);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const fallback = <div className={props.className} aria-hidden="true" />;
  if (props.enabled === false || !canAnimate) return fallback;

  return (
    <Suspense fallback={fallback}>
      <PlasmaCanvas {...props} />
    </Suspense>
  );
};

export default Plasma;
