import { API } from '../../config';
import { mapFeedToFeatureData } from '../../utils/blog/blogUtils';

export interface PostConfig {
  maxResults?: number;
  orderBy?: string;
  pageToken?: string;
  fetchBodies?: boolean;
  fetchImages?: boolean;
}

export interface SinglePostConfig {
  key?: string;
}

const defaultPostConfig: PostConfig = {
  maxResults: 10,
  orderBy: 'published',
  fetchBodies: true,
  fetchImages: true
};

export const BlogService = {
  getPosts: async (config: PostConfig = defaultPostConfig) => {
    try {
      const response = await API.blogPost({ params: config });
      if (response.status === 200) {
        return response.data;
      }
      throw new Error('Failed to fetch posts');
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  getFeaturedPost: async () => {
    try {
      const response = await API.blogSummary({
        params: {
          alt: 'json',
          'max-results': 1
        }
      });
      
      if (response.status === 200) {
        return mapFeedToFeatureData(response.data);
      }
      throw new Error('Failed to fetch featured post');
    } catch (error) {
      console.error('Error fetching featured post:', error);
      throw error;
    }
  },

  getPostById: async (id: string, config: SinglePostConfig = {}) => {
    try {
      const response = await API.blogPost({
        path: id,
        params: config
      });
      
      if (response.status === 200) {
        return response.data;
      }
      throw new Error('Failed to fetch post');
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }
};
