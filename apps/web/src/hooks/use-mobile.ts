'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport is mobile-sized.
 * Returns `undefined` during SSR/hydration to prevent hydration mismatches,
 * then returns the actual value once mounted on the client.
 */
export function useIsMobile(breakpoint: number = 768): boolean | undefined {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check after mount
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect if the viewport is tablet-sized.
 * Returns `undefined` during SSR/hydration to prevent hydration mismatches.
 */
export function useIsTablet(): boolean | undefined {
  const [isTablet, setIsTablet] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);

    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  return isTablet;
}

/**
 * Hook to detect the current device type.
 * Returns `undefined` during SSR/hydration to prevent hydration mismatches.
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' | undefined {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | undefined>(undefined);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

/**
 * Hook that returns true only after the component has mounted on the client.
 * Useful for deferring client-only rendering to prevent hydration mismatches.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
