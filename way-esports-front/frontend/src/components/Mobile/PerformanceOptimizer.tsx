import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

const OptimizerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const PerformanceIndicator = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
      font-family: 'Orbitron', monospace;
  z-index: 9999;
  opacity: ${({ $isVisible }) => $isVisible ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 0, 0.3);
`;

const FPSMeter = styled.div<{ $fps: number }>`
  color: ${({ $fps }) => 
    $fps >= 50 ? '#2ed573' :
    $fps >= 30 ? '#ffd700' :
    '#ff6b00'};
  font-weight: bold;
`;

interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  batteryLevel?: number;
  networkSpeed?: number;
}

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableFPSMonitoring?: boolean;
  enableMemoryMonitoring?: boolean;
  enableBatteryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  showPerformanceIndicator?: boolean;
  className?: string;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  enableFPSMonitoring = true,
  enableMemoryMonitoring = true,
  enableBatteryMonitoring = true,
  enableNetworkMonitoring = true,
  showPerformanceIndicator = false,
  className,
}) => {
  const { deviceInfo } = useMobileOptimization();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ fps: 60 });
  const [showIndicator, setShowIndicator] = useState(showPerformanceIndicator);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // FPS monitoring
  const measureFPS = useRef(() => {
    if (!enableFPSMonitoring) return;

    frameCountRef.current++;
    const currentTime = performance.now();
    
    if (currentTime - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
      setMetrics(prev => ({ ...prev, fps }));
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS.current);
  });

  useEffect(() => {
    if (enableFPSMonitoring) {
      measureFPS.current();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enableFPSMonitoring]);

  // Memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring || !('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
      }
    };

    const interval = setInterval(checkMemory, 5000);
    checkMemory();

    return () => clearInterval(interval);
  }, [enableMemoryMonitoring]);

  // Battery monitoring
  useEffect(() => {
    if (!enableBatteryMonitoring || !('getBattery' in navigator)) return;

    const checkBattery = async () => {
      try {
        const battery = await (navigator as any).getBattery();
        const level = Math.round(battery.level * 100);
        setMetrics(prev => ({ ...prev, batteryLevel: level }));

        battery.addEventListener('levelchange', () => {
          setMetrics(prev => ({ ...prev, batteryLevel: Math.round(battery.level * 100) }));
        });
      } catch (error) {
        console.log('Battery API not supported');
      }
    };

    checkBattery();
  }, [enableBatteryMonitoring]);

  // Network monitoring
  useEffect(() => {
    if (!enableNetworkMonitoring || !('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    if (connection) {
      const updateNetworkSpeed = () => {
        const speed = connection.downlink || 0;
        setMetrics(prev => ({ ...prev, networkSpeed: speed }));
      };

      connection.addEventListener('change', updateNetworkSpeed);
      updateNetworkSpeed();

      return () => {
        connection.removeEventListener('change', updateNetworkSpeed);
      };
    }
  }, [enableNetworkMonitoring]);

  // Performance optimizations
  useEffect(() => {
    if (!deviceInfo.isMobile) return;

    // Optimize scrolling
    const optimizeScrolling = () => {
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        .optimized-scroll {
          overflow-scrolling: touch;
          -webkit-overflow-scrolling: touch;
        }
        
        .hardware-accelerated {
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          will-change: transform;
        }
        
        .reduce-motion {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    };

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
      });
    };

    // Optimize animations for low-end devices
    const optimizeAnimations = () => {
      if (metrics.fps < 30) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };

    const cleanup1 = optimizeScrolling();
    optimizeImages();
    optimizeAnimations();

    // Re-optimize on metrics change
    const interval = setInterval(optimizeAnimations, 2000);

    return () => {
      cleanup1();
      clearInterval(interval);
    };
  }, [deviceInfo.isMobile, metrics.fps]);

  // Memory management
  useEffect(() => {
    if (!deviceInfo.isMobile) return;

    const cleanupMemory = () => {
      // Clear unused images from cache
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('image-cache')) {
              caches.delete(cacheName);
            }
          });
        });
      }
    };

    // Cleanup memory every 5 minutes
    const interval = setInterval(cleanupMemory, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [deviceInfo.isMobile]);

  // Show performance indicator on long press
  useEffect(() => {
    if (!showPerformanceIndicator) return;

    let longPressTimer: NodeJS.Timeout;

    const handleTouchStart = () => {
      longPressTimer = setTimeout(() => {
        setShowIndicator(true);
      }, 1000);
    };

    const handleTouchEnd = () => {
      clearTimeout(longPressTimer);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      clearTimeout(longPressTimer);
    };
  }, [showPerformanceIndicator]);

  return (
    <OptimizerContainer className={className}>
      {children}
      
      {showIndicator && (
        <PerformanceIndicator $isVisible={showIndicator}>
          <div>FPS: <FPSMeter $fps={metrics.fps}>{metrics.fps}</FPSMeter></div>
          {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage}MB</div>}
          {metrics.batteryLevel && <div>Battery: {metrics.batteryLevel}%</div>}
          {metrics.networkSpeed && <div>Network: {metrics.networkSpeed}Mbps</div>}
        </PerformanceIndicator>
      )}
    </OptimizerContainer>
  );
};

export default PerformanceOptimizer; 