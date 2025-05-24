import { getSlugFromUrl, extractImage } from './blogUtils';
import { getHistoryData, saveHistoryData, getHistoryKey } from './indexedDBUtils';

// Constants (Moved FOLLOW_KEY and MANGA_KEY to userUtils.js - Keep them here for reference if needed, but they are not used as store names)
// export const FOLLOW_KEY = 'history_follow_posts';
// export const MANGA_KEY = 'history_manga_bookmarks';
export const LAST_SYNC_KEY = 'last_sync_time';
export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Helper function to extract post data
export const extractPostData = (post) => {
  if (!post) return null;
  return {
    ...post,
    id: post.id || Date.now().toString(),
    slug: post.slug || (post.url ? getSlugFromUrl(post.url) : ''),
    thumbnail: post.thumbnail || (post.content ? extractImage(post.content) : null)
  };
};

// Helper function to merge arrays without duplicates
const mergeArrays = (userItems, guestItems, timeKey) => {
  const itemMap = new Map();
  userItems.forEach(item => {
    const key = item.currentPage !== undefined ? `${item.id}_p${item.currentPage}` : item.id;
    itemMap.set(key, item);
  });
  guestItems.forEach(item => {
    const key = item.currentPage !== undefined ? `${item.id}_p${item.currentPage}` : item.id;
    const existingItem = itemMap.get(key);
    const guestTime = parseInt(item[timeKey]) || 0;
    const existingTime = existingItem ? (parseInt(existingItem[timeKey]) || 0) : 0;
    if (!existingItem || guestTime > existingTime) {
      itemMap.set(key, { ...item, [timeKey]: guestTime });
    }
  });
  return Array.from(itemMap.values()).sort((a, b) => (parseInt(b[timeKey]) || 0) - (parseInt(a[timeKey]) || 0));
};

// Save manga bookmark (async)
export const saveMangaBookmark = async (bookmark) => {
  let userId = 'guest';
  try {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (userInfo && userInfo.sub) userId = userInfo.sub;
  } catch {}
  try {
    // Use 'bookmarks' as the store name
    let bookmarks = await getHistoryData('bookmarks', userId);
    const bookmarkId = `${bookmark.id}_p${bookmark.currentPage + 1}`;
    bookmarks = bookmarks.filter(b => !(b.id === bookmark.id && b.currentPage === bookmark.currentPage));
    bookmarks.unshift({ ...bookmark, bookmarkId, timestamp: Date.now() });
    if (bookmarks.length > 50) bookmarks = bookmarks.slice(0, 50);
    // Use 'bookmarks' as the store name
    await saveHistoryData('bookmarks', userId, bookmarks);
    return true;
  } catch (err) {
    console.error('Error saving manga bookmark:', err);
    return false;
  }
};

// Sync guest data to user account (async)
export const syncGuestData = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');
    // Use 'favorites' and 'bookmarks' as store names
    const guestFollowPosts = await getHistoryData('favorites', 'guest');
    const guestBookmarks = await getHistoryData('bookmarks', 'guest');
    const userFollowPosts = await getHistoryData('favorites', userId);
    const userBookmarks = await getHistoryData('bookmarks', userId);
    const mergedFollowPosts = mergeArrays(userFollowPosts, guestFollowPosts, 'followAt');
    const mergedBookmarks = mergeArrays(userBookmarks, guestBookmarks, 'timestamp');
    // Use 'favorites' and 'bookmarks' as store names
    await saveHistoryData('favorites', userId, mergedFollowPosts);
    await saveHistoryData('bookmarks', userId, mergedBookmarks);
    // Không cần xóa localStorage guest nữa
    return {
      followCount: mergedFollowPosts.length,
      bookmarkCount: mergedBookmarks.length,
      synced: true,
      changes: {
        follows: mergedFollowPosts.length - userFollowPosts.length,
        bookmarks: mergedBookmarks.length - userBookmarks.length
      }
    };
  } catch (err) {
    console.error('Error syncing guest data:', err);
    throw err;
  }
};

// Helper function to check if a post is followed (async)
export const isFollowed = async (post, userId = 'guest') => {
  if (!post || !post.id) return false;
  // Use 'favorites' as the store name
  const followedPosts = await getHistoryData('favorites', userId);
  return followedPosts.some(item => item.id === post.id);
};

// Helper function to save a post as followed (async)
export const saveFollow = async (post, userId = 'guest') => {
  if (!post || !post.id) return false;

  // Use 'favorites' as the store name
  let followedPosts = await getHistoryData('favorites', userId);

  // Remove if already exists to avoid duplicates and update timestamp/followAt
  followedPosts = followedPosts.filter(item => item.id !== post.id);

  // Add new follow entry with current timestamp
  followedPosts.unshift({
    id: post.id,
    title: post.title,
    url: post.url,
    published: post.published,
    updated: post.updated,
    labels: post.labels,
    followAt: Date.now(), // Add follow timestamp
    timestamp: Date.now(), // Keep general timestamp
  });

  // Use 'favorites' as the store name
  await saveHistoryData('favorites', userId, followedPosts);
  return true;
};

// Helper function to remove a post from followed (async)
export const removeFollow = async (post, userId = 'guest') => {
  if (!post || !post.id) return false;

  // Use 'favorites' as the store name
  let followedPosts = await getHistoryData('favorites', userId);

  // Filter out the post to remove
  followedPosts = followedPosts.filter(item => item.id !== post.id);

  // Use 'favorites' as the store name
  await saveHistoryData('favorites', userId, followedPosts);
  return true;
};

// Helper function to check if sync is needed
export const shouldSync = () => {
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
  return Date.now() - lastSync > SYNC_INTERVAL;
};

// Helper function to get latest timestamp
export const getLatestTimestamp = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return Math.max(...items.map(item => parseInt(item.timestamp) || 0));
}; 