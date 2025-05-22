// Image extraction and optimization
export const extractImage = (content) => {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
};

export const optimizeThumbnail = (url, size = 600) => {
  if (!url) return null;

  // Handle Google Blogger/Picasa image URLs
  if (url.includes('blogger.googleusercontent.com')) {
    try {
      // Check if URL has /s{size}/ pattern
      const hasSizeInPath = /\/s\d+\//.test(url);
      
      if (hasSizeInPath) {
        // If URL has /s{size}/, update the size
        return url.replace(/\/s\d+\//, `/s${size}/`);
      } else {
        // If URL doesn't have /s{size}/, add =s{size}
        // First remove any existing =s parameter if exists
        let cleanUrl = url;
        if (cleanUrl.includes('=s')) {
          cleanUrl = cleanUrl.split('=')[0];
        }
        return `${cleanUrl}=s${size}`;
      }
    } catch (error) {
      console.error('Error processing Blogger image URL:', error);
      return url;
    }
  }

  // Handle other image hosting services if needed
  if (url.includes('i.imgur.com')) {
    return url.replace(/(\.[^.]+)$/, `m$1`); // medium thumbnail
  }

  return url;
};

// URL handling
export const getSlugFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.slice(1);
  } catch {
    return '';
  }
};

// Grid configuration
export const gridConfig = {
  base: { cols: 2, items: 4 },    // Mobile: 2 columns x 2 rows = 4 items
  sm: { cols: 3, items: 6 },      // iPad Mini/Tablet: 3 columns x 2 rows = 6 items
  md: { cols: 3, items: 6 },      // iPad/Tablet: 3 columns x 2 rows = 6 items
  lg: { cols: 4, items: 8 },      // Desktop: 4 columns x 2 rows = 8 items
  xl: { cols: 5, items: 10 },     // Large Desktop: 5 columns x 2 rows = 10 items
  '2xl': { cols: 5, items: 10 }   // Extra Large: 5 columns x 2 rows = 10 items
};

// Get thumbnail by comparing slugs
export const getThumbnailBySlug = (posts, targetSlug) => {
  if (!posts || !targetSlug) return null;

  // Normalize the target slug
  const normalizedTargetSlug = targetSlug.replace(/^\/+|\/+$/g, '');

  // Find the post with matching slug
  const matchingPost = posts.find(post => {
    if (!post.url) return false;
    const postSlug = getSlugFromUrl(post.url);
    return postSlug === normalizedTargetSlug;
  });

  if (!matchingPost) return null;

  // First try to get thumbnail from post metadata
  if (matchingPost.thumbnail) {
    return matchingPost.thumbnail;
  }

  // Then try to extract from content
  if (matchingPost.content) {
    const contentThumbnail = extractImage(matchingPost.content);
    if (contentThumbnail) {
      return contentThumbnail;
    }
  }

  // If no thumbnail found, try to get first image from images array
  if (matchingPost.images && matchingPost.images.length > 0) {
    return matchingPost.images[0];
  }

  return null;
}; 