import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  let numColumns = 2; // default for mobile grids
  if (isTablet) numColumns = 3;
  if (isDesktop) numColumns = 4;

  // For lists or content wrappers that shouldn't stretch too far
  const contentMaxWidth = 1200;
  
  // Dynamic padding to feel balanced on bigger screens
  let containerPadding = 16;
  if (isTablet) containerPadding = 24;
  if (isDesktop) containerPadding = 32;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    numColumns,
    contentMaxWidth,
    containerPadding,
  };
}
