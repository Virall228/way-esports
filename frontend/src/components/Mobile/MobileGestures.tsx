import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const GestureContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y;
`;

const SwipeIndicator = styled.div<{ $direction: 'left' | 'right' | 'up' | 'down' | null }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 107, 0, 0.9);
  color: white;
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  z-index: 9999;
  opacity: ${({ $direction }) => $direction ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  &::before {
    content: '${({ $direction }) => 
      $direction === 'left' ? '←' :
      $direction === 'right' ? '→' :
      $direction === 'up' ? '↑' :
      $direction === 'down' ? '↓' : ''}';
    margin-right: 10px;
    font-size: 24px;
  }
`;

const PullToRefreshIndicator = styled.div<{ $isVisible: boolean; $progress: number }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.9), rgba(255, 215, 0, 0.9));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  z-index: 1000;
  transform: translateY(${({ $isVisible, $progress }) => $isVisible ? 0 : -60}px);
  transition: transform 0.3s ease;
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);

  &::before {
    content: '${({ $progress }) => $progress > 0.8 ? '🔄' : '⬇️'}';
    margin-right: 10px;
    font-size: 20px;
    animation: ${({ $progress }) => $progress > 0.8 ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const BottomSheet = styled.div<{ $isVisible: boolean; $height: number }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${({ $height }) => $height}px;
  background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(26, 26, 26, 0.95));
  border-radius: 20px 20px 0 0;
  transform: translateY(${({ $isVisible }) => $isVisible ? 0 : '100%'});
  transition: transform 0.3s ease;
  z-index: 1000;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 0, 0.2);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const BottomSheetHandle = styled.div`
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 12px auto;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const BottomSheetContent = styled.div`
  padding: 20px;
  height: calc(100% - 40px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

interface MobileGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => void;
  enablePullToRefresh?: boolean;
  enableSwipeGestures?: boolean;
  className?: string;
}

const MobileGestures: React.FC<MobileGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  enablePullToRefresh = true,
  enableSwipeGestures = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [pullToRefreshVisible, setPullToRefreshVisible] = useState(false);
  const [pullToRefreshProgress, setPullToRefreshProgress] = useState(0);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(300);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return;

      const currentY = e.targetTouches[0].clientY;
      const deltaY = currentY - touchStart.y;

      // Pull to refresh logic
      if (enablePullToRefresh && deltaY > 0 && window.scrollY === 0) {
        const progress = Math.min(deltaY / 100, 1);
        setPullToRefreshProgress(progress);
        setPullToRefreshVisible(progress > 0.1);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart || !touchEnd) return;

      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
      const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

      // Handle pull to refresh
      if (enablePullToRefresh && pullToRefreshVisible && pullToRefreshProgress > 0.8) {
        onPullToRefresh?.();
        setPullToRefreshVisible(false);
        setPullToRefreshProgress(0);
        return;
      }

      // Reset pull to refresh
      setPullToRefreshVisible(false);
      setPullToRefreshProgress(0);

      // Handle swipe gestures
      if (enableSwipeGestures && Math.abs(distanceX) > minSwipeDistance || Math.abs(distanceY) > minSwipeDistance) {
        if (isHorizontalSwipe) {
          if (distanceX > 0) {
            // Swipe left
            setSwipeDirection('left');
            onSwipeLeft?.();
          } else {
            // Swipe right
            setSwipeDirection('right');
            onSwipeRight?.();
          }
        } else if (isVerticalSwipe) {
          if (distanceY > 0) {
            // Swipe up
            setSwipeDirection('up');
            onSwipeUp?.();
          } else {
            // Swipe down
            setSwipeDirection('down');
            onSwipeDown?.();
          }
        }

        // Clear swipe direction after animation
        setTimeout(() => setSwipeDirection(null), 1000);
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [touchStart, touchEnd, pullToRefreshVisible, pullToRefreshProgress, enablePullToRefresh, enableSwipeGestures, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPullToRefresh]);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  return (
    <>
      <GestureContainer 
        ref={containerRef}
        onTouchMove={handleTouchMove}
        className={className}
      >
        {children}
      </GestureContainer>

      <SwipeIndicator $direction={swipeDirection} />

      <PullToRefreshIndicator 
        $isVisible={pullToRefreshVisible} 
        $progress={pullToRefreshProgress}
      >
        {pullToRefreshProgress > 0.8 ? 'Release to refresh' : 'Pull to refresh'}
      </PullToRefreshIndicator>

      <BottomSheet $isVisible={bottomSheetVisible} $height={bottomSheetHeight}>
        <BottomSheetHandle />
        <BottomSheetContent>
          {/* Bottom sheet content can be added here */}
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
};

export default MobileGestures; 