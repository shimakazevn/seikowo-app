import { blogConfig } from './config';
import { getCachedData, setCachedData, CACHE_KEYS } from './utils/cache';
import { ErrorTypes, AppError } from './utils/errorHandler.jsx';
import { handleError } from './utils/errorHandler.jsx';
import { getValidToken } from './api/auth';

// Re-export error handling
export { ErrorTypes, AppError, handleError };

// Re-export auth functions
export * from './api/auth';

// Re-export blogger functions
export * from './api/blogger';

// Additional utility functions
export const getPostUrl = (postId) => {
  return `https://www.blogger.com/blog/post/edit/${blogConfig.blogId}/${postId}`;
};

export const getPageUrl = (pageId) => {
  return `https://www.blogger.com/blog/page/edit/${blogConfig.blogId}/${pageId}`;
};

export const getBlogUrl = () => {
  return `https://www.blogger.com/blog/${blogConfig.blogId}`;
};

export const getPostViewUrl = (postId) => {
  return `https://seikowoteam.blogspot.com/${postId}`;
};

export const getPageViewUrl = (pageId) => {
  return `https://seikowoteam.blogspot.com/p/${pageId}`;
};

export const getTagUrl = (tag) => {
  return `https://seikowoteam.blogspot.com/search/label/${encodeURIComponent(tag)}`;
};

export const getYearUrl = (year) => {
  return `https://seikowoteam.blogspot.com/search?updated-max=${year}-12-31T23:59:59%2B07:00&updated-min=${year}-01-01T00:00:00%2B07:00`;
};

export const getSearchUrl = (keyword) => {
  return `https://seikowoteam.blogspot.com/search?q=${encodeURIComponent(keyword)}`;
};

export const getRSSUrl = () => {
  return 'https://seikowoteam.blogspot.com/feeds/posts/default?alt=rss';
};

export const getRSSProxyUrl = () => {
  return `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(getRSSUrl())}`;
};

export const getRSSFeed = async () => {
  try {
    const cachedData = getCachedData(CACHE_KEYS.RSS);
    if (cachedData) return cachedData;

    const response = await fetch(getRSSProxyUrl());
    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `RSS API Error: ${response.status}`
      );
    }

    const data = await response.json();
    setCachedData(CACHE_KEYS.RSS, data);
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getRSSFeedItems = async () => {
  try {
    const feed = await getRSSFeed();
    return feed.items || [];
  } catch (error) {
    throw handleError(error);
  }
};

export const getRSSFeedItem = async (guid) => {
  try {
    const items = await getRSSFeedItems();
    return items.find(item => item.guid === guid);
  } catch (error) {
    throw handleError(error);
  }
};

export const getRSSFeedItemsByTag = async (tag) => {
  try {
    const items = await getRSSFeedItems();
    return items.filter(item => 
      item.categories && 
      item.categories.some(category => 
        category.toLowerCase() === tag.toLowerCase()
      )
    );
  } catch (error) {
    throw handleError(error);
  }
};

export const getRSSFeedItemsByYear = async (year) => {
  try {
    const items = await getRSSFeedItems();
    return items.filter(item => {
      const date = new Date(item.pubDate);
      return date.getFullYear() === year;
    });
  } catch (error) {
    throw handleError(error);
  }
};

export const getRSSFeedItemsBySearch = async (keyword) => {
  try {
    const items = await getRSSFeedItems();
    const searchTerm = keyword.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
  } catch (error) {
    throw handleError(error);
  }
}; 