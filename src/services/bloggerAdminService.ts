// Blogger Admin Service - for creating and managing posts
import { blogConfig } from '../config';
import { authService } from './authService';

// Types for Blogger API
export interface BloggerPost {
  id?: string;
  title: string;
  content: string;
  labels?: string[];
  status?: 'DRAFT' | 'LIVE' | 'SCHEDULED';
  published?: string;
  updated?: string;
  url?: string;
  author?: {
    id: string;
    displayName: string;
    url: string;
    image: {
      url: string;
    };
  };
  blog?: {
    id: string;
  };
  customMetaData?: string;
  location?: {
    name: string;
    lat: number;
    lng: number;
    span: string;
  };
  images?: Array<{
    url: string;
  }>;
  replies?: {
    totalItems: number;
  };
  etag?: string;
  selfLink?: string;
  titleLink?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  labels?: string[];
  status?: 'DRAFT' | 'LIVE' | 'SCHEDULED';
  published?: string;
}

export interface UpdatePostRequest extends CreatePostRequest {
  id: string;
}

export interface BloggerApiResponse<T> {
  kind: string;
  items?: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  etag?: string;
}

export class BloggerAdminService {
  private static instance: BloggerAdminService;
  private baseUrl = 'https://www.googleapis.com/blogger/v3';

  static getInstance(): BloggerAdminService {
    if (!BloggerAdminService.instance) {
      BloggerAdminService.instance = new BloggerAdminService();
    }
    return BloggerAdminService.instance;
  }

  private async getAuthHeaders(retryCount = 0): Promise<HeadersInit> {
    // Check if user is authenticated first
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('Auth token not found in response');
    }

    // Check if token is valid (this will auto-refresh if needed)
    const isTokenValid = await authService.tokenManager.isTokenValid();
    if (!isTokenValid) {
      throw new Error('Auth token not found in response');
    }

    const tokens = await authService.tokenManager.getTokens();
    if (!tokens?.accessToken) {
      throw new Error('Auth token not found in response');
    }

    console.log('[BloggerAdmin] Using access token:', tokens.accessToken.substring(0, 20) + '...');

    return {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      console.error('[BloggerAdmin] API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorText: errorText
      });

      // Handle authentication errors specifically
      if (response.status === 401 || response.status === 403) {
        console.error('[BloggerAdmin] Authentication error detected');

        // Try to refresh token instead of logging out
        const tokens = await authService.tokenManager.getTokens();
        if (tokens?.refreshToken) {
          console.log('[BloggerAdmin] Attempting token refresh...');
          const refreshed = await authService.tokenManager.refreshAccessToken(tokens.refreshToken);
          if (refreshed) {
            console.log('[BloggerAdmin] Token refreshed, request should be retried');
            throw new Error('TOKEN_REFRESHED'); // Special error to indicate retry needed
          }
        }

        console.error('[BloggerAdmin] Cannot refresh token, user needs to re-authenticate');
        await authService.logout();
        throw new Error('Auth token not found in response');
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  }

  // Create a new post
  async createPost(postData: CreatePostRequest): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Creating new post:', postData.title, 'Status:', postData.status);

      const headers = await this.getAuthHeaders();

      // For draft posts, we need to use a different approach
      if (postData.status === 'DRAFT') {
        // Create as draft using the draft endpoint
        const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts`;

        // Remove status from the payload as Blogger API handles drafts differently
        const { status, ...postPayload } = postData;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...postPayload,
            // Don't include published date to keep it as draft
          }),
        });

        const result = await this.handleApiResponse<BloggerPost>(response);

        // If the post was published automatically, revert it to draft
        if (result.status === 'LIVE') {
          console.log('[BloggerAdmin] Post was published, reverting to draft...');
          try {
            const draftResult = await this.revertToDraft(result.id!);
            console.log('[BloggerAdmin] Post reverted to draft successfully');
            return draftResult;
          } catch (revertError) {
            console.warn('[BloggerAdmin] Could not revert to draft, but post created:', revertError);
            return result;
          }
        }

        console.log('[BloggerAdmin] Draft post created successfully:', result.id);
        return result;
      } else {
        // For published posts, use normal creation
        const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts`;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(postData),
        });

        const result = await this.handleApiResponse<BloggerPost>(response);
        console.log('[BloggerAdmin] Published post created successfully:', result.id);
        return result;
      }
    } catch (error) {
      console.error('[BloggerAdmin] Error creating post:', error);
      throw error;
    }
  }

  // Create a draft post specifically
  async createDraftPost(postData: Omit<CreatePostRequest, 'status'>): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Creating draft post:', postData.title);

      const headers = await this.getAuthHeaders();

      // Use the posts endpoint with isDraft parameter
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?isDraft=true`;

      // Create post payload for draft with minimal required fields
      const draftPayload = {
        kind: 'blogger#post',
        blog: {
          id: blogConfig.blogId
        },
        title: postData.title || 'Untitled Post',
        content: postData.content || '<p>Content...</p>',
        labels: postData.labels || [],
        // Explicitly don't set published date to keep as draft
        // published: undefined, // This should keep it as draft
      };

      console.log('[BloggerAdmin] Sending draft payload:', draftPayload);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(draftPayload),
      });

      console.log('[BloggerAdmin] Response status:', response.status);
      console.log('[BloggerAdmin] Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await this.handleApiResponse<BloggerPost>(response);

      console.log('[BloggerAdmin] Draft post created with full response:', {
        id: result.id,
        status: result.status,
        published: result.published,
        updated: result.updated,
        title: result.title
      });

      // Double-check and revert if still published
      if (result.status === 'LIVE' && result.id) {
        console.log('[BloggerAdmin] Post was still auto-published, reverting to draft...');
        try {
          return await this.revertToDraft(result.id);
        } catch (revertError) {
          console.warn('[BloggerAdmin] Could not revert to draft:', revertError);
          // Return the post anyway, user can manually revert
          return result;
        }
      }

      console.log('[BloggerAdmin] Draft post created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error creating draft post:', error);
      throw error;
    }
  }

  // Get all draft posts to understand the API behavior
  async getDraftPosts(): Promise<BloggerPost[]> {
    try {
      console.log('[BloggerAdmin] Fetching draft posts...');

      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?status=draft&maxResults=50&view=ADMIN`;

      const response = await fetch(url, { headers });
      const data = await this.handleApiResponse<{ items?: BloggerPost[] }>(response);

      console.log('[BloggerAdmin] Draft posts found:', data.items?.length || 0);
      if (data.items) {
        data.items.forEach(post => {
          console.log(`[BloggerAdmin] Draft: ${post.title} (${post.status})`);
        });
      }
      return data.items || [];
    } catch (error) {
      console.error('[BloggerAdmin] Error fetching draft posts:', error);
      return [];
    }
  }

  // Update an existing post
  async updatePost(postData: UpdatePostRequest): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Updating post:', postData.id);

      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postData.id}`;

      const { id, ...updateData } = postData;
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      const result = await this.handleApiResponse<BloggerPost>(response);
      console.log('[BloggerAdmin] Post updated successfully');
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error updating post:', error);
      throw error;
    }
  }

  // Delete a post
  async deletePost(postId: string): Promise<void> {
    try {
      console.log('[BloggerAdmin] Deleting post:', postId);

      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }

      console.log('[BloggerAdmin] Post deleted successfully');
    } catch (error) {
      console.error('[BloggerAdmin] Error deleting post:', error);
      throw error;
    }
  }

  // Get a specific post for editing (handles both published and draft posts)
  async getPost(postId: string): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Fetching post for editing:', postId);

      const headers = await this.getAuthHeaders();

      // First try with ADMIN view to get more details
      let url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}?view=ADMIN`;

      console.log('[BloggerAdmin] Trying admin view endpoint:', url);
      let response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // If not found with admin view, try regular endpoint
      if (response.status === 404) {
        console.log('[BloggerAdmin] Post not found with admin view, trying regular endpoint...');
        url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}`;
        response = await fetch(url, {
          method: 'GET',
          headers,
        });
      }

      // If still not found, try to find in all posts (including drafts)
      if (response.status === 404) {
        console.log('[BloggerAdmin] Post not found, searching in all posts...');

        try {
          // Search in all posts with admin view
          const allPostsUrl = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=100&view=ADMIN`;
          const allPostsResponse = await fetch(allPostsUrl, { headers });

          if (allPostsResponse.ok) {
            const allPostsData = await this.handleApiResponse<{ items?: BloggerPost[] }>(allPostsResponse);
            const foundPost = allPostsData.items?.find(post => post.id === postId);

            if (foundPost) {
              console.log('[BloggerAdmin] Found post in all posts:', foundPost.title, 'Status:', foundPost.status);
              return foundPost;
            }
          }
        } catch (searchError) {
          console.warn('[BloggerAdmin] Error searching in all posts:', searchError);
        }
      }

      const result = await this.handleApiResponse<BloggerPost>(response);
      console.log('[BloggerAdmin] Post fetched successfully:', result.title, 'Status:', result.status);
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error fetching post:', error);
      throw error;
    }
  }

  // Get posts by status with admin view (includes more stats)
  async getPostsByStatus(
    status: 'DRAFT' | 'LIVE',
    maxResults: number = 25,
    pageToken?: string
  ): Promise<BloggerApiResponse<BloggerPost>> {
    try {
      console.log(`[BloggerAdmin] Fetching ${status.toLowerCase()} posts with admin view`);

      const headers = await this.getAuthHeaders();
      let url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&status=${status.toLowerCase()}&view=ADMIN`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await this.handleApiResponse<BloggerApiResponse<BloggerPost>>(response);
      console.log(`[BloggerAdmin] ${status} posts fetched:`, result.items?.length || 0);
      return result;
    } catch (error) {
      console.error(`[BloggerAdmin] Error fetching ${status} posts:`, error);
      throw error;
    }
  }

  // Get all posts including drafts for admin (alternative approach)
  async getAllPostsIncludingDrafts(maxResults: number = 20): Promise<BloggerPost[]> {
    try {
      console.log('[BloggerAdmin] Fetching all posts including drafts...');

      const headers = await this.getAuthHeaders();

      // Fetch live posts
      console.log('[BloggerAdmin] Fetching live posts...');
      const liveUrl = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&view=ADMIN&status=live&fetchBodies=false`;
      const liveResponse = await fetch(liveUrl, { headers });

      if (!liveResponse.ok) {
        console.error('[BloggerAdmin] Live posts fetch failed:', liveResponse.status, liveResponse.statusText);
      }

      const liveData = await this.handleApiResponse<{ items?: BloggerPost[] }>(liveResponse);

      // Fetch draft posts
      console.log('[BloggerAdmin] Fetching draft posts...');
      const draftUrl = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&view=ADMIN&status=draft&fetchBodies=false`;
      const draftResponse = await fetch(draftUrl, { headers });

      if (!draftResponse.ok) {
        console.error('[BloggerAdmin] Draft posts fetch failed:', draftResponse.status, draftResponse.statusText);
      }

      const draftData = await this.handleApiResponse<{ items?: BloggerPost[] }>(draftResponse);

      // Combine and sort by updated date
      const allPosts = [
        ...(liveData.items || []),
        ...(draftData.items || [])
      ].sort((a, b) => {
        const dateA = new Date(a.updated || a.published || 0).getTime();
        const dateB = new Date(b.updated || b.published || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      console.log('[BloggerAdmin] All posts fetched successfully:', {
        live: liveData.items?.length || 0,
        draft: draftData.items?.length || 0,
        total: allPosts.length,
        posts: allPosts.map(p => ({ title: p.title, status: p.status, id: p.id }))
      });

      return allPosts;
    } catch (error: any) {
      console.error('[BloggerAdmin] Error fetching all posts including drafts:', error);

      // Provide more specific error information
      if (error.message?.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.message?.includes('403')) {
        throw new Error('Access denied. Check blog permissions.');
      } else if (error.message?.includes('404')) {
        throw new Error('Blog not found. Check blog ID configuration.');
      }

      throw error;
    }
  }

  // Get all posts for admin management with pagination
  async getAllPosts(maxResults: number = 20, pageToken?: string, retryCount = 0): Promise<BloggerApiResponse<BloggerPost>> {
    try {
      console.log('[BloggerAdmin] Fetching all posts for admin', { maxResults, pageToken, retryCount });

      const headers = await this.getAuthHeaders();

      // Fetch all posts including drafts for admin management
      let url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&view=ADMIN&fetchBodies=false&status=live,draft`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await this.handleApiResponse<BloggerApiResponse<BloggerPost>>(response);

      console.log('[BloggerAdmin] Posts fetched successfully:', {
        count: result.items?.length || 0,
        hasNextPage: !!result.nextPageToken
      });

      return result;
    } catch (error: any) {
      console.error('[BloggerAdmin] Error fetching posts:', error);

      // Retry once if token was refreshed
      if (error.message === 'TOKEN_REFRESHED' && retryCount === 0) {
        console.log('[BloggerAdmin] Retrying getAllPosts after token refresh...');
        return this.getAllPosts(maxResults, pageToken, retryCount + 1);
      }

      throw error;
    }
  }

  // Publish a draft post
  async publishPost(postId: string): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Publishing post:', postId);

      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}/publish`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      const result = await this.handleApiResponse<BloggerPost>(response);
      console.log('[BloggerAdmin] Post published successfully');
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error publishing post:', error);
      throw error;
    }
  }

  // Revert a post to draft
  async revertToDraft(postId: string): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Reverting post to draft:', postId);

      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}/revert`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      const result = await this.handleApiResponse<BloggerPost>(response);
      console.log('[BloggerAdmin] Post reverted to draft successfully');
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error reverting post:', error);
      throw error;
    }
  }

  // Get blog info
  async getBlogInfo(): Promise<any> {
    try {
      console.log('[BloggerAdmin] Fetching blog info');

      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await this.handleApiResponse<any>(response);
      console.log('[BloggerAdmin] Blog info fetched successfully');
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error fetching blog info:', error);
      throw error;
    }
  }

  // Image upload functionality removed


}

// Export singleton instance
export const bloggerAdminService = BloggerAdminService.getInstance();
