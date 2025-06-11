export interface Post {
  url?: string;
  thumbnail?: string;
  content?: string;
  images?: string[];
}

export interface GridConfig {
  base: { cols: number; items: number };
  sm: { cols: number; items: number };
  md: { cols: number; items: number };
  lg: { cols: number; items: number };
  xl: { cols: number; items: number };
  '2xl': { cols: number; items: number };
}

// Image extraction and optimization
export const extractImage = (content: string): string | null => {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
};

export const extractImages = (content: string): string[] => {
  if (!content) return [];

  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const images: string[] = [];
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return images;
};

export const optimizeThumbnail = (url: string, size: number = 600): string | null => {
  if (!url) return null;

  // Handle Google Blogger/Picasa image URLs
  if (url.includes('blogger.googleusercontent.com')) {
    try {
      // Check if URL has /s{size}/ pattern
      const hasSizeInPath = /\/s\d+\//.test(url);
      let optimizedUrl: string;
      if (hasSizeInPath) {
        // If URL has /s{size}/, update the size
        optimizedUrl = url.replace(/\/s\d+\//, `/s${size}/`);
      } else {
        // If URL doesn't have /s{size}/, add =s{size}
        // First remove any existing =s parameter if exists
        let cleanUrl = url;
        if (cleanUrl.includes('=s')) {
          cleanUrl = cleanUrl.split('=')[0];
        }
        optimizedUrl = `${cleanUrl}=s${size}`;
      }
      // Đổi đuôi sang webp nếu có thể
      return convertToWebpUrl(optimizedUrl);
    } catch (error: any) {
      console.error('Error processing Blogger image URL:', error);
      return url;
    }
  }

  // Handle other image hosting services if needed
  if (url.includes('i.imgur.com')) {
    const optimizedUrl = url.replace(/(\.[^.]+)$/, `m$1`); // medium thumbnail
    return convertToWebpUrl(optimizedUrl);
  }

  // Đổi đuôi sang webp nếu có thể cho các trường hợp còn lại
  return convertToWebpUrl(url);
};

// Grid configuration
export const gridConfig: GridConfig = {
  base: { cols: 2, items: 20 },    // Mobile: 2 columns x 10 rows = 20 items (ATOM supports more)
  sm: { cols: 3, items: 30 },      // iPad Mini/Tablet: 3 columns x 10 rows = 30 items
  md: { cols: 3, items: 30 },      // iPad/Tablet: 3 columns x 10 rows = 30 items
  lg: { cols: 4, items: 40 },      // Desktop: 4 columns x 10 rows = 40 items
  xl: { cols: 5, items: 50 },      // Large Desktop: 5 columns x 10 rows = 50 items
  '2xl': { cols: 5, items: 50 }   // Extra Large: 5 columns x 10 rows = 50 items
};

// Get thumbnail by comparing slugs
export const getThumbnailBySlug = (posts: any[], targetSlug: string): string | null => {
  if (!posts || !targetSlug) return null;

  // Normalize the target slug
  const normalizedTargetSlug = targetSlug.replace(/^\/+|\/+$/g, '');

  // Find the post with matching slug
  const matchingPost = posts.find(post => {
    if (!post.url) return false;
    const postSlug = getSlugFromUrl(post.url || "");
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

// Chuyển đuôi ảnh sang .webp nếu có thể
export const convertToWebpUrl = (url: string): string => {
  if (!url) return url;
  // Chỉ đổi nếu là jpg, jpeg, png
  return url.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2');
};

export const getSlugFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url, 'http://dummy.com');
    const slug = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    return slug;
  } catch {
    const slug = url.replace(/^\/+|\/+$/g, '');
    return slug;
  }
};