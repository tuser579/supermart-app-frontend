import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const isLargeDesktop = width >= 1280;

  let numColumns = 2; // default for mobile grids
  if (isTablet) numColumns = 3;
  if (isDesktop) numColumns = 4; // 4 products per row on desktop

  const contentMaxWidth = 1280;
  
  let containerPadding = 16;
  if (isTablet) containerPadding = 24;
  if (isDesktop) containerPadding = 32;

  let gridGap = 12;
  if (isTablet) gridGap = 16;
  if (isDesktop) gridGap = 20;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    numColumns,
    contentMaxWidth,
    containerPadding,
    gridGap,
  };
}
