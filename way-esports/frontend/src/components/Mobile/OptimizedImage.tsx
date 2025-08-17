import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

const ImageContainer = styled.div<{ $loading: boolean; $error: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${({ $loading, $error }) => 
    $error ? 'linear-gradient(135deg, #ff6b00, #ff8533)' :
    $loading ? 'linear-gradient(135deg, rgba(42, 42, 42, 0.8), rgba(26, 26, 26, 0.8))' :
    'transparent'};
  border-radius: inherit;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledImage = styled.img<{ 
  $loaded: boolean; 
  $error: boolean;
  $isMobile: boolean;
}>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: ${({ $loaded, $error }) => $loaded && !$error ? 1 : 0};
  transform: ${({ $loaded, $isMobile }) => 
    $loaded && $isMobile ? 'scale(1.02)' : 'scale(1)'};
  
  &:hover {
    transform: ${({ $isMobile }) => $isMobile ? 'scale(1.02)' : 'scale(1.05)'};
  }

  /* Optimize for mobile */
  ${({ $isMobile }) => $isMobile && `
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  `}
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 107, 0, 0.3);
  border-top: 3px solid #ff6b00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  color: #ff6b00;
  text-align: center;
`;

const ErrorText = styled.div`
  color: #ffffff;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
`;

const LazyLoadPlaceholder = styled.div<{ $aspectRatio: string }>`
  width: 100%;
  aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
  background: linear-gradient(135deg, rgba(42, 42, 42, 0.8), rgba(26, 26, 26, 0.8));
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
`;

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  lazy?: boolean;
  priority?: boolean;
  fallback?: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  aspectRatio = '16/9',
  lazy = true,
  priority = false,
  fallback,
  className,
  onClick,
  onLoad,
  onError,
}) => {
  const { isMobile, screenWidth } = useMobileOptimization();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate optimized image URL based on device
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc) return '';
    
    // For mobile devices, you could add image optimization parameters
    if (isMobile && screenWidth < 768) {
      // Add mobile optimization parameters if your CDN supports it
      return originalSrc;
    }
    
    return originalSrc;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority]);

  // Load image when in view
  useEffect(() => {
    if (isInView && src) {
      const optimizedSrc = getOptimizedSrc(src);
      setCurrentSrc(optimizedSrc);
    }
  }, [isInView, src, isMobile, screenWidth]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(false);
    
    // Try fallback image
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
    } else {
      onError?.();
    }
  };

  const handleClick = () => {
    if (onClick) {
      // Add haptic feedback on mobile
      if (isMobile && navigator.vibrate) {
        navigator.vibrate(50);
      }
      onClick();
    }
  };

  // Preload high priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  if (!isInView) {
    return (
      <LazyLoadPlaceholder 
        ref={containerRef}
        $aspectRatio={aspectRatio}
        className={className}
      >
        Loading...
      </LazyLoadPlaceholder>
    );
  }

  return (
    <ImageContainer
      ref={containerRef}
      $loading={!isLoaded && !hasError}
      $error={hasError}
      className={className}
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {!isLoaded && !hasError && <LoadingSpinner />}
      
      {hasError && (
        <>
          <ErrorIcon>🖼️</ErrorIcon>
          <ErrorText>Failed to load image</ErrorText>
        </>
      )}

      {currentSrc && (
        <StyledImage
          ref={imageRef}
          src={currentSrc}
          alt={alt}
          $loaded={isLoaded}
          $error={hasError}
          $isMobile={isMobile}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          style={{
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '100%',
          }}
        />
      )}
    </ImageContainer>
  );
};

export default OptimizedImage; 