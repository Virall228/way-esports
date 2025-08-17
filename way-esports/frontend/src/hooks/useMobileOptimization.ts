import { useState, useEffect, useCallback } from 'react';

interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  hasTouch: boolean;
  hasVibration: boolean;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useMobileOptimization = () => {
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
    hasTouch: false,
    hasVibration: false,
  });

  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);

  // Detect device information
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasVibration = 'vibrate' in navigator;

      // Determine device type
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;

      if (hasTouch) {
        if (screenWidth < 768) {
          isMobile = true;
        } else if (screenWidth < 1024) {
          isTablet = true;
        } else {
          isDesktop = true;
        }
      } else {
        isDesktop = true;
      }

      // Determine orientation
      const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        screenWidth,
        screenHeight,
        orientation,
        hasTouch,
        hasVibration,
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  // Vibration feedback
  const vibrate = useCallback((pattern: number | number[] = 100) => {
    if (deviceInfo.hasVibration) {
      navigator.vibrate(pattern);
    }
  }, [deviceInfo.hasVibration]);

  // Touch gesture detection
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    });
    setTouchEnd(null);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    });
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const deltaTime = touchEnd.timestamp - touchStart.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Minimum swipe distance and velocity
    const minDistance = 50;
    const minVelocity = 0.3;

    if (distance > minDistance && velocity > minVelocity) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      let direction: SwipeGesture['direction'];
      if (isHorizontal) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const gesture: SwipeGesture = {
        direction,
        distance,
        velocity,
      };

      // Trigger vibration feedback
      vibrate(50);

      // You can add custom logic here or return the gesture
      console.log('Swipe gesture detected:', gesture);
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, vibrate]);

  // Add touch event listeners
  useEffect(() => {
    if (deviceInfo.hasTouch) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [deviceInfo.hasTouch, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Prevent zoom on input focus (iOS)
  useEffect(() => {
    if (deviceInfo.isIOS) {
      const preventZoom = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          target.style.fontSize = '16px';
        }
      };

      document.addEventListener('focusin', preventZoom);
      return () => document.removeEventListener('focusin', preventZoom);
    }
  }, [deviceInfo.isIOS]);

  // Add safe area padding for devices with notches
  useEffect(() => {
    if (deviceInfo.isIOS || deviceInfo.isAndroid) {
      const style = document.createElement('style');
      style.textContent = `
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .safe-area-left {
          padding-left: env(safe-area-inset-left);
        }
        .safe-area-right {
          padding-right: env(safe-area-inset-right);
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [deviceInfo.isIOS, deviceInfo.isAndroid]);

  // Optimize scrolling performance
  useEffect(() => {
    if (deviceInfo.hasTouch) {
      const style = document.createElement('style');
      style.textContent = `
        .scrollable {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }
        .no-scroll {
          overflow: hidden;
          position: fixed;
          width: 100%;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [deviceInfo.hasTouch]);

  return {
    deviceInfo,
    vibrate,
    // Utility functions
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    isIOS: deviceInfo.isIOS,
    isAndroid: deviceInfo.isAndroid,
    hasTouch: deviceInfo.hasTouch,
    hasVibration: deviceInfo.hasVibration,
    screenWidth: deviceInfo.screenWidth,
    screenHeight: deviceInfo.screenHeight,
    orientation: deviceInfo.orientation,
  };
}; 