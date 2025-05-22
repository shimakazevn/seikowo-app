import { getSlugFromUrl, extractImage } from './blogUtils';

// Constants
export const READ_KEY = 'history_read_posts';
export const FOLLOW_KEY = 'history_follow_posts';
export const MANGA_KEY = 'history_manga_bookmarks';
export const LAST_SYNC_KEY = 'last_sync_time';
export const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Helper function to get data with userId
export const getHistoryData = (key, userId) => {
  const fullKey = `${key}_${userId}`;
  try {
    const data = localStorage.getItem(fullKey);
    if (!data) return [];
    
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) return [];
    
    // Filter out invalid entries
    return parsedData.filter(item => item && typeof item === 'object');
  } catch (err) {
    console.error(`Error getting ${key} data:`, err);
    return [];
  }
};

// Helper function to save data with userId
export const saveHistoryData = (key, userId, data) => {
  const fullKey = `${key}_${userId}`;
  try {
    // Validate input data
    if (!Array.isArray(data)) {
      console.error(`Invalid data format for ${key}, expected array`);
      return;
    }

    // Filter out invalid items and ensure all items have required fields
    const processedData = data
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        ...item,
        id: item.id || Date.now().toString(),
        timestamp: item.timestamp || Date.now()
      }));
    
    localStorage.setItem(fullKey, JSON.stringify(processedData));
  } catch (err) {
    console.error(`Error saving ${key} data:`, err);
  }
};

// Save manga bookmark
export const saveMangaBookmark = (bookmark) => {
  const userId = localStorage.getItem('google_user_id') || 'guest';
  try {
    let bookmarks = getHistoryData(MANGA_KEY, userId);
    
    // Generate unique bookmark ID using post ID and page number
    const bookmarkId = `${bookmark.id}_p${bookmark.currentPage + 1}`;
    
    // Remove old entry if exists for the same page
    bookmarks = bookmarks.filter(b => 
      !(b.id === bookmark.id && b.currentPage === bookmark.currentPage)
    );
    
    // Add new bookmark at the beginning
    bookmarks.unshift({
      ...bookmark,
      bookmarkId,
      timestamp: Date.now()
    });
    
    // Keep only latest 50 bookmarks
    if (bookmarks.length > 50) {
      bookmarks = bookmarks.slice(0, 50);
    }
    
    saveHistoryData(MANGA_KEY, userId, bookmarks);
    return true;
  } catch (err) {
    console.error('Error saving manga bookmark:', err);
    return false;
  }
};

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
  // Create a map to store merged items
  const itemMap = new Map();
  
  // First add all user items
  userItems.forEach(item => {
    const key = item.currentPage !== undefined ? 
      `${item.id}_p${item.currentPage}` : 
      item.id;
    itemMap.set(key, item);
    console.log(`Added user item: ${item.title} (${new Date(parseInt(item[timeKey])).toLocaleString()})`);
  });

  // Then merge guest items
  guestItems.forEach(item => {
    const key = item.currentPage !== undefined ? 
      `${item.id}_p${item.currentPage}` : 
      item.id;
    const existingItem = itemMap.get(key);
    
    const guestTime = parseInt(item[timeKey]) || 0;
    const existingTime = existingItem ? (parseInt(existingItem[timeKey]) || 0) : 0;

    console.log(`Checking guest item: ${item.title}`);
    console.log(`- Guest time: ${new Date(guestTime).toLocaleString()}`);
    console.log(`- Existing time: ${existingTime ? new Date(existingTime).toLocaleString() : 'none'}`);
    
    // Add guest item if:
    // 1. No existing item, or
    // 2. Guest item is newer
    if (!existingItem || guestTime > existingTime) {
      itemMap.set(key, {
        ...item,
        [timeKey]: guestTime
      });
      console.log(`Added/Updated from guest: ${item.title}`);
    }
  });

  // Convert map back to array and sort by timestamp (newest first)
  const result = Array.from(itemMap.values())
    .sort((a, b) => (parseInt(b[timeKey]) || 0) - (parseInt(a[timeKey]) || 0));

  console.log('Merge results:', {
    userCount: userItems.length,
    guestCount: guestItems.length,
    mergedCount: result.length,
    items: result.map(item => ({
      title: item.title,
      time: new Date(parseInt(item[timeKey])).toLocaleString()
    }))
  });

  return result;
};

// Helper function to sync guest data to user account
export const syncGuestData = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Starting guest data sync for user:', userId);

    // Get guest data
    const guestReadPosts = getHistoryData(READ_KEY, 'guest');
    const guestFollowPosts = getHistoryData(FOLLOW_KEY, 'guest');
    const guestBookmarks = getHistoryData(MANGA_KEY, 'guest');

    console.log('Guest data counts:', {
      reads: guestReadPosts.length,
      follows: guestFollowPosts.length,
      bookmarks: guestBookmarks.length
    });

    // Get user data
    const userReadPosts = getHistoryData(READ_KEY, userId);
    const userFollowPosts = getHistoryData(FOLLOW_KEY, userId);
    const userBookmarks = getHistoryData(MANGA_KEY, userId);

    console.log('User data counts:', {
      reads: userReadPosts.length,
      follows: userFollowPosts.length,
      bookmarks: userBookmarks.length
    });

    // Merge data
    const mergedReadPosts = mergeArrays(userReadPosts, guestReadPosts, 'readAt');
    const mergedFollowPosts = mergeArrays(userFollowPosts, guestFollowPosts, 'followAt');
    const mergedBookmarks = mergeArrays(userBookmarks, guestBookmarks, 'timestamp');

    // Save merged data
    saveHistoryData(READ_KEY, userId, mergedReadPosts);
    saveHistoryData(FOLLOW_KEY, userId, mergedFollowPosts);
    saveHistoryData(MANGA_KEY, userId, mergedBookmarks);

    // Clear guest data only if merge was successful
    localStorage.removeItem(`${READ_KEY}_guest`);
    localStorage.removeItem(`${FOLLOW_KEY}_guest`);
    localStorage.removeItem(`${MANGA_KEY}_guest`);

    // Return sync results
    const result = {
      readCount: mergedReadPosts.length,
      followCount: mergedFollowPosts.length,
      bookmarkCount: mergedBookmarks.length,
      synced: true,
      changes: {
        reads: mergedReadPosts.length - userReadPosts.length,
        follows: mergedFollowPosts.length - userFollowPosts.length,
        bookmarks: mergedBookmarks.length - userBookmarks.length
      }
    };

    console.log('Sync completed:', result);
    return result;
  } catch (err) {
    console.error('Error syncing guest data:', err);
    throw err;
  }
};

// Helper function to check if sync is needed
export const shouldSync = () => {
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
  return Date.now() - lastSync > SYNC_INTERVAL;
};

// Helper function to get latest timestamp
export const getLatestTimestamp = (userId) => {
  const timestamps = [];
  try {
    const readData = getHistoryData(READ_KEY, userId);
    const followData = getHistoryData(FOLLOW_KEY, userId);
    const mangaData = getHistoryData(MANGA_KEY, userId);
    
    if (readData.length > 0) timestamps.push(readData[0].readAt);
    if (followData.length > 0) timestamps.push(followData[0].followAt);
    if (mangaData.length > 0) timestamps.push(mangaData[0].timestamp);
  } catch (err) {
    console.error('Error getting latest timestamp:', err);
  }
  
  return timestamps.length > 0 ? Math.max(...timestamps) : 0;
}; 