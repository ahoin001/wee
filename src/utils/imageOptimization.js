// Image optimization utilities for better performance

// Intersection Observer for lazy loading
class LazyImageLoader {
  constructor() {
    this.observer = null;
    this.images = new Map();
    this.initObserver();
  }

  initObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before image comes into view
          threshold: 0.01
        }
      );
    }
  }

  observe(imageElement, src, placeholder = null) {
    if (!this.observer) {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(imageElement, src);
      return;
    }

    // Set placeholder if provided
    if (placeholder) {
      imageElement.style.backgroundImage = `url(${placeholder})`;
      imageElement.style.backgroundSize = 'cover';
      imageElement.style.backgroundPosition = 'center';
    }

    // Store the source for later loading
    this.images.set(imageElement, src);
    this.observer.observe(imageElement);
  }

  loadImage(imageElement, src = null) {
    const imageSrc = src || this.images.get(imageElement);
    if (!imageSrc) return;

    // Create a new image to preload
    const img = new Image();
    
    img.onload = () => {
      // Apply the loaded image
      if (imageElement.tagName === 'IMG') {
        imageElement.src = imageSrc;
      } else {
        imageElement.style.backgroundImage = `url(${imageSrc})`;
      }
      
      // Add loaded class for animations
      imageElement.classList.add('image-loaded');
      
      // Remove from tracking
      this.images.delete(imageElement);
    };

    img.onerror = () => {
      console.warn('Failed to load image:', imageSrc);
      imageElement.classList.add('image-error');
      this.images.delete(imageElement);
    };

    img.src = imageSrc;
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.images.clear();
  }
}

// Global lazy loader instance
const lazyLoader = new LazyImageLoader();

// Image compression utility
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Progressive image loading
export const createProgressiveImage = (lowResSrc, highResSrc, element) => {
  // Load low resolution first
  const lowResImg = new Image();
  lowResImg.onload = () => {
    if (element.tagName === 'IMG') {
      element.src = lowResSrc;
    } else {
      element.style.backgroundImage = `url(${lowResSrc})`;
    }
    element.classList.add('image-progressive-low');

    // Then load high resolution
    const highResImg = new Image();
    highResImg.onload = () => {
      if (element.tagName === 'IMG') {
        element.src = highResSrc;
      } else {
        element.style.backgroundImage = `url(${highResSrc})`;
      }
      element.classList.remove('image-progressive-low');
      element.classList.add('image-progressive-high');
    };
    highResImg.src = highResSrc;
  };
  lowResImg.src = lowResSrc;
};

// React hook for lazy loading images
export const useLazyImage = (src, placeholder = null) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const imageRef = React.useRef(null);

  React.useEffect(() => {
    if (!src || !imageRef.current) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsError(false);
    };

    img.onerror = () => {
      setIsError(true);
      setIsLoaded(false);
    };

    img.src = src;
  }, [src]);

  const observe = React.useCallback(() => {
    if (imageRef.current && src) {
      lazyLoader.observe(imageRef.current, src, placeholder);
    }
  }, [src, placeholder]);

  return {
    imageRef,
    isLoaded,
    isError,
    observe
  };
};

// Image preloading utility
export const preloadImages = (urls) => {
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
};

// WebP support detection
export const supportsWebP = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Generate responsive image sources
export const generateResponsiveSources = (baseUrl, sizes = []) => {
  const defaultSizes = [320, 640, 960, 1280, 1920];
  const imageSizes = sizes.length > 0 ? sizes : defaultSizes;
  
  return imageSizes.map(size => ({
    src: `${baseUrl}?w=${size}`,
    width: size,
    media: `(max-width: ${size}px)`
  }));
};

// Image optimization settings
export const imageOptimizationSettings = {
  // Compression settings
  compression: {
    jpeg: { quality: 0.8, progressive: true },
    png: { quality: 0.9, compressionLevel: 6 },
    webp: { quality: 0.8, lossless: false }
  },

  // Lazy loading settings
  lazyLoading: {
    rootMargin: '50px 0px',
    threshold: 0.01,
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+'
  },

  // Progressive loading settings
  progressive: {
    lowResQuality: 0.3,
    highResQuality: 0.8,
    transitionDuration: '0.3s'
  }
};

// Utility to get optimal image format
export const getOptimalImageFormat = async () => {
  const webPSupported = await supportsWebP();
  return webPSupported ? 'webp' : 'jpeg';
};

// Cleanup function
export const cleanupImageOptimization = () => {
  lazyLoader.disconnect();
};

// Default export
export default {
  lazyLoader,
  compressImage,
  createProgressiveImage,
  useLazyImage,
  preloadImages,
  supportsWebP,
  generateResponsiveSources,
  imageOptimizationSettings,
  getOptimalImageFormat,
  cleanupImageOptimization
};
