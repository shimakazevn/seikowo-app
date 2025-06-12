import { getHistoryData, saveHistoryData } from './indexedDBUtils';
import { backupUserData } from '../api/auth';
import { PostData, FollowedPost } from './postUtils';

// Helper to extract thumbnail from content (if needed)
function extractImage(content: string): string | null {
  if (!content) return null;
  const match = content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return match ? match[1] : null;
}

// Helper function to check if a post is followed
export const isFollowed = async (post: PostData | { data: PostData }, userId: string = 'guest'): Promise<boolean> => {
  if (!post) throw new Error('Post data is required');
  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost || !realPost.id) throw new Error('Invalid post data structure');
  try {
    const followedPosts = (userId ? await getHistoryData('follows', userId) : []) as FollowedPost[];
    return Array.isArray(followedPosts) && followedPosts.some((item: FollowedPost) => item.id === realPost.id);
  } catch (error: any) {
    console.error('Error checking if post is followed:', error);
    throw error;
  }
};

// Helper function to save a post as followed
export const saveFollow = async (post: PostData | { data: PostData }, userId: string = 'guest'): Promise<boolean> => {
  if (!post) throw new Error('Post data is required');
  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost || !realPost.id) throw new Error('Invalid post data structure');
  try {
    const followedPosts = (userId ? await getHistoryData('favorites', userId) : []) as FollowedPost[];
    const filteredPosts: FollowedPost[] = Array.isArray(followedPosts) ? followedPosts.filter((item: FollowedPost) => item.id !== realPost.id) : [];
    const thumbnail = realPost.thumbnail || (realPost.content ? extractImage(realPost.content) : null);
    const newFollow: FollowedPost = {
      id: realPost.id,
      title: realPost.title,
      url: realPost.url,
      published: realPost.published,
      updated: realPost.updated,
      labels: realPost.labels,
      thumbnail,
      followAt: Date.now(),
    };
    const updatedPosts = [newFollow, ...filteredPosts].slice(0, 1000);
    userId ? await saveHistoryData('favorites', userId, updatedPosts) : Promise.resolve();
    return true;
  } catch (error: any) {
    console.error('Error saving follow:', error);
    throw error;
  }
};

// Helper function to remove a post from followed
export const removeFollow = async (post: PostData | { data: PostData }, userId: string = 'guest'): Promise<boolean> => {
  if (!post) throw new Error('Post data is required');
  const realPost = (post as { data: PostData })?.data ? (post as { data: PostData }).data : (post as PostData);
  if (!realPost || !realPost.id) throw new Error('Invalid post data structure');
  try {
    const followedPosts = (userId ? await getHistoryData('favorites', userId) : []) as FollowedPost[];
    if (!Array.isArray(followedPosts)) return true;
    const updatedPosts = followedPosts.filter((item: FollowedPost) => item.id !== realPost.id);
    userId ? await saveHistoryData('favorites', userId, updatedPosts) : Promise.resolve();
    return true;
  } catch (error: any) {
    console.error('Error removing follow:', error);
    throw error;
  }
};

// Interface for toast function
interface ToastFunction {
  (options: {
    title: string;
    description: string;
    status: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    isClosable: boolean;
  }): void;
}

// Interface for handleFollowClick parameters
interface HandleFollowClickParams {
  post: PostData | { data: PostData };
  userId: string | null;
  accessToken: string | null;
  toast?: ToastFunction;
  setFollowed?: (followed: boolean) => void;
  backupUserDataFn?: typeof backupUserData;
  getHistoryDataFn?: typeof getHistoryData;
}

// Main handler for follow/unfollow click
export const handleFollowClick = async (params: HandleFollowClickParams): Promise<void> => {
  console.log('handleFollowClick called with:', params);
  const {
    post,
    userId,
    accessToken,
    toast,
    setFollowed,
    backupUserDataFn = backupUserData,
    getHistoryDataFn = getHistoryData,
  } = params;
  try {
    if (!userId) {
      console.log('No userId, aborting follow');
      toast && toast({
        title: 'Lỗi',
        description: 'Vui lòng đăng nhập để sử dụng tính năng này',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    console.log('Checking isFollowed for post:', post, 'userId:', userId);
    const isCurrentlyFollowed = await isFollowed(post, userId);
    console.log('isCurrentlyFollowed:', isCurrentlyFollowed);
    if (isCurrentlyFollowed) {
      await removeFollow(post, userId);
      setFollowed && setFollowed(false);
      console.log('Removed follow for post:', (post as PostData).id || (post as { data: PostData }).data.id);
      toast && toast({
        title: 'Đã bỏ theo dõi',
        description: 'Bạn đã bỏ theo dõi truyện này',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      await saveFollow(post, userId);
      setFollowed && setFollowed(true);
      console.log('Saved follow for post:', (post as PostData).id || (post as { data: PostData }).data.id);
      toast && toast({
        title: 'Đã theo dõi',
        description: 'Bạn đã theo dõi truyện này',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    // Backup to Google Drive if logged in
    if (accessToken && userId) {
      try {
        const favoritePosts = await getHistoryDataFn('favorites', userId);
        const mangaBookmarks = await getHistoryDataFn('bookmarks', userId);
        const readPosts = await getHistoryDataFn('reads', userId);
        const data = { favoritePosts, mangaBookmarks, readPosts };
        console.log('Backing up to Google Drive:', data);
        await backupUserDataFn(accessToken, userId, data);
      } catch (err) {
        console.error('Error backing up to Google Drive:', err);
        toast && toast({
          title: 'Lỗi sao lưu',
          description: 'Không thể sao lưu dữ liệu lên Google Drive',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  } catch (err) {
    console.error('Error handling follow:', err);
    toast && toast({
      title: 'Lỗi',
      description: 'Không thể thực hiện thao tác theo dõi',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  }
};