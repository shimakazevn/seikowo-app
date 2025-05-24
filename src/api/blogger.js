import { blogConfig } from '../config';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';
import { ErrorTypes, AppError, handleError } from '../api';

export const fetchPosts = async (params = {}) => {
  const { maxResults = 200, pageToken, orderBy, view } = params;
  try {
    // Try to get from cache first
    const cachedData = getCachedData(CACHE_KEYS.POSTS);
    if (cachedData) return cachedData;

    // Build URL dynamically, only add orderBy/view if provided
    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=${maxResults}`;
    if (orderBy) url += `&orderBy=${orderBy}`;
    if (view) url += `&view=${view}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    const data = await response.json();
    
    // Save to cache
    setCachedData(CACHE_KEYS.POSTS, data);
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

export const fetchPostsByTag = async (params = {}) => {
  const { label, maxResults = 100, pageToken, orderBy, view } = params;
  try {
    const encodedLabel = encodeURIComponent(label);
    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&labels=${encodedLabel}&maxResults=${maxResults}`;
    if (orderBy) url += `&orderBy=${orderBy}`;
    if (view) url += `&view=${view}`;
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    throw handleError(error);
  }
};

export const fetchPages = async (maxResults = 50) => {
  try {
    const cachedData = getCachedData(CACHE_KEYS.PAGES);
    if (cachedData) return cachedData;

    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/pages?key=${blogConfig.apiKey}&maxResults=${maxResults}`
    );

    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    const data = await response.json();
    setCachedData(CACHE_KEYS.PAGES, data);
    return data;
  } catch (error) {
    throw handleError(error);
  }
};

export const searchPosts = async (params) => {
  try {
    const { keyword, tag, year, pageToken, maxResults = 10 } = params;
    let url = `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts/search?key=${blogConfig.apiKey}&maxResults=${maxResults}`;
    
    if (keyword) url += `&q=${encodeURIComponent(keyword.trim())}`;
    if (tag) url += `&labels=${encodeURIComponent(tag)}`;
    if (year) {
      url += `&publishedMin=${year}-01-01T00:00:00Z`;
      url += `&publishedMax=${year}-12-31T23:59:59Z`;
    }
    if (pageToken) url += `&pageToken=${pageToken}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `API Error: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    throw handleError(error);
  }
};

export const fetchRSSFeed = async () => {
  try {
    const BLOG_RSS_URL = 'https://seikowoteam.blogspot.com/feeds/posts/default?alt=rss';
    const RSS_PROXY = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(BLOG_RSS_URL)}`;
    
    const response = await fetch(RSS_PROXY);
    if (!response.ok) {
      throw new AppError(
        ErrorTypes.API_ERROR,
        `RSS API Error: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    throw handleError(error);
  }
}; 