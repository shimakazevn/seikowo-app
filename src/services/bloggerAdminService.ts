// Blogger Admin Service - for creating and managing posts
import { blogConfig } from '../config';
import { authService } from './authService';

// Types for Blogger API
export interface BloggerPost {
  id?: string;
  title: string;
  content: string;
  labels?: string[];
  status: 'DRAFT' | 'LIVE' | 'SCHEDULED';
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

export interface BloggerPostUserInfo {
  post: BloggerPost;
  blogId: string;
  postId: string;
  userId: string;
  hasEditAccess?: boolean;
  kind: string;
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
    try {
      // Check if user is authenticated first
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        console.error('[BloggerAdmin] User is not authenticated');
        throw new Error('Auth token not found in response');
      }

      // Get tokens directly from token manager
      const tokens = await authService.tokenManager.getTokens();
      if (!tokens?.accessToken) {
        console.error('[BloggerAdmin] No access token available');
        throw new Error('Auth token not found in response');
      }

      console.log('[BloggerAdmin] Using access token:', tokens.accessToken.substring(0, 20) + '...');

      return {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('[BloggerAdmin] Error in getAuthHeaders:', error);
      throw error;
    }
  }

  // Check if user has author access to the blog
  private async checkUserRole(): Promise<boolean> {
    try {
      const tokens = await authService.tokenManager.getTokens();
      if (!tokens?.accessToken) {
        console.log('[BloggerAdmin] No access token available');
        return false;
      }

      console.log('[BloggerAdmin] Checking user role for blog:', blogConfig.blogId);
      
      // Check user's role for this blog using self
      const userRoleResponse = await fetch(
        `${this.baseUrl}/users/self/blogs/${blogConfig.blogId}?view=AUTHOR`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!userRoleResponse.ok) {
        const errorText = await userRoleResponse.text();
        console.error('[BloggerAdmin] Failed to get user role:', {
          status: userRoleResponse.status,
          statusText: userRoleResponse.statusText,
          error: errorText
        });
        return false;
      }

      const blogData = await userRoleResponse.json();
      console.log('[BloggerAdmin] Blog info:', blogData);

      // Check if user has author access
      const role = blogData.blog_user_info?.role;
      const hasAccess = role === 'ADMIN' || role === 'AUTHOR';
      console.log('[BloggerAdmin] User access check result:', {
        role,
        hasAccess
      });

      return hasAccess;
    } catch (error) {
      console.error('[BloggerAdmin] Error checking user role:', error);
      return false;
    }
  }

  // New public method to check author access
  public async hasAuthorAccess(): Promise<boolean> {
    const role = await this.getBloggerUserRole();
    return role === 'ADMIN' || role === 'AUTHOR';
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

      // Check user permissions first
      const hasAccess = await this.hasAuthorAccess();
      if (!hasAccess) {
        throw new Error('You do not have permission to create posts. Please make sure you are an admin or author.');
      }

      const headers = await this.getAuthHeaders();
      const currentUser = await authService.getCurrentUser();
      const authorInfo = currentUser?.id ? { id: currentUser.id, displayName: currentUser.name || 'Unknown', url: '', image: { url: currentUser.picture || '' } } : undefined;

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
            author: authorInfo,
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
      }

      // For published posts, use normal creation
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            ...postData,
            author: authorInfo
        }),
      });

      const result = await this.handleApiResponse<BloggerPost>(response);
      console.log('[BloggerAdmin] Published post created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error creating post:', error);
      throw error;
    }
  }

  // Create a draft post specifically
  async createDraftPost(postData: Omit<CreatePostRequest, 'status'>): Promise<BloggerPost> {
    try {
      console.log('[BloggerAdmin] Creating draft post:', postData.title);

      // Check user permissions first
      const hasAccess = await this.hasAuthorAccess();
      if (!hasAccess) {
        throw new Error('You do not have permission to create posts. Please make sure you are an admin or author.');
      }

      const headers = await this.getAuthHeaders();
      const currentUser = await authService.getCurrentUser();
      const authorInfo = currentUser?.id ? { id: currentUser.id, displayName: currentUser.name || 'Unknown', url: '', image: { url: currentUser.picture || '' } } : undefined;

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
        author: authorInfo,
        // Explicitly don't set published date to keep as draft
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

      // First try with AUTHOR view since we want to support both admin and author access
      let url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}?view=AUTHOR`;

      console.log('[BloggerAdmin] Trying author view endpoint:', url);
      let response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // If not found with author view, try regular endpoint
      if (response.status === 404) {
        console.log('[BloggerAdmin] Post not found with author view, trying regular endpoint...');
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
          // Search in all posts with author view
          const allPostsUrl = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=100&view=AUTHOR`;
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

        // If we get here, the post was not found
        throw new Error('Post not found. It may have been deleted or you may not have access to it.');
      }

      const result = await this.handleApiResponse<BloggerPost>(response);
      console.log('[BloggerAdmin] Post fetched successfully:', result.title, 'Status:', result.status);
      return result;
    } catch (error) {
      console.error('[BloggerAdmin] Error fetching post:', error);
      throw error;
    }
  }

  // Get posts by status with author view
  async getPostsByStatus(
    status: 'DRAFT' | 'LIVE',
    maxResults: number = 25,
    pageToken?: string
  ): Promise<BloggerApiResponse<BloggerPost>> {
    try {
      console.log('[BloggerAdmin] Fetching', status, 'posts with author view');
      const headers = await this.getAuthHeaders();

      // Check user role using Blogger API
      const isAdmin = await this.checkUserRole();
      if (!isAdmin) {
        console.error('[BloggerAdmin] User does not have admin access');
        throw new Error('You do not have access to this blog. Please make sure you are an admin or author.');
      }

      const response = await fetch(
        `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?status=${status}&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}&view=AUTHOR`,
        {
          headers,
        }
      );

      return await this.handleApiResponse<BloggerApiResponse<BloggerPost>>(response);
    } catch (error) {
      console.error('[BloggerAdmin] Error fetching', status, 'posts:', error);
      throw error;
    }
  }

  // Get all posts including drafts for admin (alternative approach)
  async getAllPostsIncludingDrafts(maxResults: number = 20): Promise<BloggerPost[]> {
    try {
      const headers = await this.getAuthHeaders();

      // Get current user info for logging
      const currentUser = await authService.getCurrentUser();
      const googleUserId = currentUser?.id;
      const bloggerUserId = '09031960469049044469'; // Your Blogger ID

      console.log('[BloggerAdmin] Fetching posts for user:', {
        googleUserId,
        bloggerUserId,
        name: currentUser?.name
      });

      // Fetch both live and draft posts
      const [liveResponse, draftResponse] = await Promise.all([
        fetch(`${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&status=live&fetchBodies=false`, { headers }),
        fetch(`${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&status=draft&fetchBodies=false`, { headers })
      ]);

      if (!liveResponse.ok) {
        console.error(`[BloggerAdmin] Failed to fetch live posts: ${liveResponse.status} ${liveResponse.statusText}`);
      }
      if (!draftResponse.ok) {
        console.error(`[BloggerAdmin] Failed to fetch draft posts: ${draftResponse.status} ${draftResponse.statusText}`);
      }

      const [liveData, draftData] = await Promise.all([
        this.handleApiResponse<{ items?: BloggerPost[] }>(liveResponse),
        this.handleApiResponse<{ items?: BloggerPost[] }>(draftResponse)
      ]);

      // Combine all posts
      const allPosts = [
        ...(liveData.items || []),
        ...(draftData.items || [])
      ];

      // Filter posts by author ID
      const userPosts = allPosts.filter(post => {
        const isAuthor = post.author?.id === googleUserId || post.author?.id === bloggerUserId;
        if (!isAuthor) {
          console.log(`[BloggerAdmin] Filtering out post: "${post.title}" (Author ID: ${post.author?.id})`);
        }
        return isAuthor;
      });

      // Sort by updated date
      userPosts.sort((a, b) => {
        const dateA = new Date(a.updated || a.published || 0).getTime();
        const dateB = new Date(b.updated || b.published || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      // Log summary
      console.log('[BloggerAdmin] Posts summary:', {
        total: userPosts.length,
        live: userPosts.filter(p => p.status === 'LIVE').length,
        draft: userPosts.filter(p => p.status === 'DRAFT').length,
        filteredOut: allPosts.length - userPosts.length
      });

      return userPosts;
    } catch (error: any) {
      console.error('[BloggerAdmin] Error fetching posts:', error.message);

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
      const headers = await this.getAuthHeaders();

      // Get current user ID
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User ID not found. Cannot fetch user-specific posts.');
      }
      const userId = currentUser.id;

      // Fetch live posts for the specific user
      let liveUrl = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&view=AUTHOR&fetchBodies=false&status=live`;
      if (pageToken) {
        liveUrl += `&pageToken=${pageToken}`;
      }
      const liveResponse = await fetch(liveUrl, { method: 'GET', headers });
      const liveResult = await this.handleApiResponse<BloggerApiResponse<BloggerPost>>(liveResponse);

      // Fetch draft posts for the specific user
      let draftUrl = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts?maxResults=${maxResults}&view=AUTHOR&fetchBodies=false&status=draft`;
      if (pageToken) {
        draftUrl += `&pageToken=${pageToken}`;
      }
      const draftResponse = await fetch(draftUrl, { method: 'GET', headers });
      const draftResult = await this.handleApiResponse<BloggerApiResponse<BloggerPost>>(draftResponse);

      // Combine results
      const combinedItems = [...(liveResult.items || []), ...(draftResult.items || [])];
      
      // Filter posts to only include those authored by the current user
      const userPosts = combinedItems.filter(post => post.author?.id === userId);

      // Log summary
      console.log('[BloggerAdmin] Posts summary:', {
        live: liveResult.items?.length || 0,
        draft: draftResult.items?.length || 0,
        filtered: userPosts.length
      });

      // Determine next page token
      const nextToken = liveResult.nextPageToken || draftResult.nextPageToken || undefined;

      return { ...liveResult, items: userPosts, nextPageToken: nextToken };
    } catch (error: any) {
      console.error('[BloggerAdmin] Error fetching posts:', error.message);

      // Retry once if token was refreshed
      if (error.message === 'TOKEN_REFRESHED' && retryCount === 0) {
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

  public async getBloggerUserRole(): Promise<'ADMIN' | 'AUTHOR' | 'READER' | 'NONE'> {
    try {
      console.log('[BloggerAdmin] Getting user role from Blogger API...');
      const tokens = await authService.tokenManager.getTokens();
      if (!tokens?.accessToken) {
        console.log('[BloggerAdmin] No access token available for role check');
        return 'NONE';
      }

      const userRoleResponse = await fetch(
        `${this.baseUrl}/users/self/blogs/${blogConfig.blogId}?view=AUTHOR`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!userRoleResponse.ok) {
        // If 404, blog not found or user has no access, consider it 'NONE'
        if (userRoleResponse.status === 404 || userRoleResponse.status === 403) {
          console.log('[BloggerAdmin] Blog not found or access denied for role check. Status:', userRoleResponse.status);
          return 'NONE';
        }

        const errorText = await userRoleResponse.text();
        console.error('[BloggerAdmin] Failed to get user role (API error):', {
          status: userRoleResponse.status,
          statusText: userRoleResponse.statusText,
          error: errorText
        });
        return 'NONE';
      }

      const blogData = await userRoleResponse.json();
      const role = blogData.blog_user_info?.role as 'ADMIN' | 'AUTHOR' | 'READER' | undefined;

      if (role) {
        console.log('[BloggerAdmin] User role found:', role);
        return role;
      } else {
        console.log('[BloggerAdmin] No specific role found for user, defaulting to READER');
        return 'READER'; // Default to READER if no explicit role is returned
      }
    } catch (error) {
      console.error('[BloggerAdmin] Error getting Blogger user role:', error);
      return 'NONE';
    }
  }
}

// Export singleton instance
export const bloggerAdminService = BloggerAdminService.getInstance();
