/**
 * OptimizedImage Component
 * Lazy-loaded image with blur-up placeholder
 * Features: Intersection Observer lazy loading, blur-up effect, error fallback
 * 
 * @module components/shared/OptimizedImage
 */

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageSkeleton } from './LoadingSkeleton';
import { colors } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/** Default placeholder color from design tokens */
const DEFAULT_PLACEHOLDER_COLOR = colors.surface.elevated;

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a tiny blur placeholder (LQIP - Low Quality Image Placeholder)
 * @param {number} width
 * @param {number} height
 * @returns {string} SVG data URI
 */
function generateBlurPlaceholder(width = 20, height = 15) {
  // Returns a tiny SVG as data URI for blur effect
  const fillColor = encodeURIComponent(DEFAULT_PLACEHOLDER_COLOR);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='${fillColor}'/%3E%3C/svg%3E`;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * OptimizedImage — Lazy-loaded image with blur-up placeholder
 * 
 * @param {{
 *   src: string,
 *   alt: string,
 *   width?: number,
 *   height?: number,
 *   className?: string,
 *   containerClassName?: string,
 *   priority?: boolean,
 *   placeholder?: 'blur' | 'color' | 'skeleton' | 'none',
 *   placeholderColor?: string,
 *   onLoad?: () => void,
 *   onError?: () => void,
 *   fallback?: React.ReactNode,
 *   loading?: 'lazy' | 'eager',
 *   decoding?: 'async' | 'sync' | 'auto',
 *   sizes?: string,
 *   srcSet?: string
 * }} props
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  containerClassName = '',
  priority = false,
  placeholder = 'blur',
  placeholderColor = DEFAULT_PLACEHOLDER_COLOR,
  onLoad,
  onError,
  fallback = null,
  loading = 'lazy',
  decoding = 'async',
  sizes = '100vw',
  srcSet,
  ...imgProps
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(priority ? src : null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority, loading]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Show fallback on error
  if (hasError && fallback) {
    return (
      <div 
        ref={containerRef}
        className={`relative overflow-hidden ${containerClassName}`}
        style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : undefined,
        backgroundColor: placeholder === 'color' ? placeholderColor : undefined
      }}
    >
      {/* Placeholder */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {placeholder === 'blur' ? (
              <img
                src={generateBlurPlaceholder(width, height)}
                alt=""
                className="w-full h-full object-cover filter blur-xl scale-110"
                aria-hidden="true"
              />
            ) : placeholder === 'skeleton' ? (
              <ImageSkeleton aspectRatio="aspect-auto" rounded="rounded-none" />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main image */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...imgProps}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ═══════════════════════════════════════════════════════════════
// Convenience Exports
// ═══════════════════════════════════════════════════════════════

/**
 * LazyImage — Simplified lazy loading image component
 * 
 * @param {{
 *   src: string,
 *   alt: string,
 *   className?: string,
 *   aspectRatio?: string
 * }} props
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-video',
  ...props
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      containerClassName={aspectRatio}
      placeholder="skeleton"
      {...props}
    />
  );
});

LazyImage.displayName = 'LazyImage';

/**
 * Avatar — Optimized avatar image with fallback
 * 
 * @param {{
 *   src: string,
 *   alt?: string,
 *   size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl',
 *   fallback?: React.ReactNode,
 *   className?: string
 * }} props
 */
export const Avatar = memo(function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback,
  className = ''
}) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div 
      className={`relative rounded-full overflow-hidden ${sizeClass} ${className}`}
      style={{ backgroundColor: colors.surface.elevated }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        containerClassName="w-full h-full"
        placeholder="color"
        fallback={
          fallback || (
            <div 
              className="w-full h-full flex items-center justify-center text-sm font-medium"
              style={{ color: colors.text.muted }}
            >
              {alt?.charAt(0).toUpperCase() || '?'}
            </div>
          )
        }
      />
    </div>
  );
});

Avatar.displayName = 'Avatar';

/**
 * BackgroundImage — Optimized background image with lazy loading
 * 
 * @param {{
 *   src: string,
 *   alt?: string,
 *   className?: string,
 *   overlay?: boolean,
 *   overlayClassName?: string,
 *   children?: React.ReactNode
 * }} props
 */
export const BackgroundImage = memo(function BackgroundImage({
  src,
  alt = '',
  className = '',
  overlay = false,
  overlayClassName = '',
  children,
  ...props
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        containerClassName="absolute inset-0"
        priority={false}
        placeholder="blur"
        {...props}
      />
      {overlay && (
        <div 
          className={`absolute inset-0 ${overlayClassName}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
});

BackgroundImage.displayName = 'BackgroundImage';

export default OptimizedImage;
