import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'placeholder'> {
  /** Source URL of the image */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the image container */
  width?: number | string;
  /** Height of the image container */
  height?: number | string;
  /** Placeholder to show while loading */
  placeholder?: 'skeleton' | 'blur' | 'none';
  /** Border radius */
  borderRadius?: number | string;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

/**
 * Lazy loading image component using Intersection Observer
 * Only loads images when they enter the viewport
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  placeholder = 'skeleton',
  borderRadius = 0,
  objectFit = 'cover',
  threshold = 0.1,
  rootMargin = '50px',
  style,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: 'grey.100',
      }}
    >
      {/* Skeleton placeholder */}
      {placeholder === 'skeleton' && !isLoaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Actual image - only rendered when in view */}
      {isInView && !hasError && (
        <Box
          component="img"
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            ...style,
          }}
          {...imgProps}
        />
      )}

      {/* Error state */}
      {hasError && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: 'grey.200',
            color: 'grey.500',
            fontSize: '0.75rem',
          }}
        >
          Failed to load
        </Box>
      )}
    </Box>
  );
};

/**
 * Hook for lazy loading images with Intersection Observer
 */
export function useLazyImage(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? '50px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin]);

  return { ref, isInView };
}

export default LazyImage;
