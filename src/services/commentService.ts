import { blogConfig } from '../config';

export interface CommentDeleteRequest {
  commentId: string;
  postId: string;
}

export class CommentService {
  private baseUrl = 'https://www.googleapis.com/blogger/v3';

  // Get auth headers
  private getAuthHeaders(accessToken: string): Record<string, string> {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Delete a comment
  async deleteComment(commentId: string, postId: string, accessToken: string): Promise<void> {
    try {
      console.log('[CommentService] Deleting comment:', { commentId, postId });

      const headers = this.getAuthHeaders(accessToken);
      const url = `${this.baseUrl}/blogs/${blogConfig.blogId}/posts/${postId}/comments/${commentId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete comment: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      console.log('[CommentService] Comment deleted successfully');
    } catch (error) {
      console.error('[CommentService] Error deleting comment:', error);
      throw error;
    }
  }

  // Check if user can delete comment (must be comment author)
  canDeleteComment(comment: any, currentUser: any): boolean {
    if (!comment || !currentUser) {
      console.log('🔍 canDeleteComment: Missing comment or user', { comment: !!comment, currentUser: !!currentUser });
      return false;
    }

    // Check if current user is the comment author
    const commentAuthorEmail = comment.author?.email?.toLowerCase();
    const commentAuthorName = comment.author?.displayName?.toLowerCase();
    const userEmail = currentUser.email?.toLowerCase();
    const userName = currentUser.name?.toLowerCase();

    const emailMatch = commentAuthorEmail === userEmail;
    const nameMatch = commentAuthorName === userName;

    console.log('🔍 canDeleteComment debug:', {
      commentAuthorEmail,
      commentAuthorName,
      userEmail,
      userName,
      emailMatch,
      nameMatch,
      result: emailMatch || nameMatch
    });

    return emailMatch || nameMatch;
  }

  // Get comment author info for display
  getCommentAuthorInfo(comment: any): { name: string; email: string; avatar: string } {
    return {
      name: comment.author?.displayName || 'Anonymous',
      email: comment.author?.email || '',
      avatar: comment.author?.image?.url || `https://www.blogger.com/img/blogger_logo_round_35.png`
    };
  }
}

// Export singleton instance
export const commentService = new CommentService();
