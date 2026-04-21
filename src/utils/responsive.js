import { Dimensions, Platform } from 'react-native';

export const getWindow = () => Dimensions.get('window');

/** True if current width looks like a tablet in any orientation */
export const isTablet = () => {
  const { width, height } = getWindow();
  const larger = Math.max(width, height);
  return larger >= 768;
};

/** True when device is currently in landscape */
export const isLandscape = () => {
  const { width, height } = getWindow();
  return width > height;
};

/**
 * Returns a value that reacts to screen changes.
 * Use inside components with useDimensions().
 */
export const getLayout = () => {
  const { width, height } = getWindow();
  const landscape = width > height;
  const tablet = Math.max(width, height) >= 768;

  return {
    width,
    height,
    landscape,
    tablet,
    // Content max-width (centered on wide screens)
    contentWidth: tablet ? Math.min(width, 900) : width,
    // Number of columns for word list grid
    wordListCols: tablet ? (landscape ? 4 : 3) : (landscape ? 3 : 2),
    // Card padding scale
    cardPad: tablet ? 28 : 20,
    // Font scale
    fontScale: tablet ? 1.15 : 1,
  };
};

/** Hook that re-renders on orientation/resize */
import { useState, useEffect } from 'react';
export const useDimensions = () => {
  const [layout, setLayout] = useState(getLayout());
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => setLayout(getLayout()));
    return () => sub?.remove();
  }, []);
  return layout;
};
