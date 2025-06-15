import { bloggerAdminService } from './bloggerAdminService';

const AUTHOR_CHECK_POST_ID = '1680637223752973741';

interface AuthorCheckData {
  googleUserId: string;
  bloggerUserId: string;
  timestamp: string;
  name: string;
  email: string;
  lastLogin: string;
}

export const authorService = {
  async checkAuthorPermission(): Promise<boolean> {
    try {
      // Use bloggerAdminService.hasAuthorAccess directly
      const hasPermission = await bloggerAdminService.hasAuthorAccess();
      console.log('[AuthorService] hasAuthorAccess result:', hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('[AuthorService] Error checking author permission:', error);
      return false;
    }
  },

  async getAuthorCheckData(): Promise<AuthorCheckData | null> {
    try {
      const post = await bloggerAdminService.getPost(AUTHOR_CHECK_POST_ID);
      if (post && post.content) {
        return JSON.parse(post.content);
      }
      return null;
    } catch (error) {
      console.error('[AuthorService] Error getting author check data:', error);
      return null;
    }
  }
}; 