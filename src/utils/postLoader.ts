import { findPostInCache, getCachedData, setCachedData, CACHE_KEYS } from './cache';
import { fetchPostsSecurely } from '../services/proxyService';
import { getSlugFromUrl } from './blogUtils';
import { Post } from '../types/global';

// Normalize slug for consistent matching
const normalizeSlug = (slug: string): string => {
  return slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

// Load post with cache-first strategy (tìm trong cache trước, fetch khi cần)
export async function loadPost(slug: string): Promise<Post | null> {
  try {
    // Handle URL decoding and normalization
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch (e) {
      console.warn('Failed to decode slug, using original:', slug);
    }

    // Remove .html extension if present
    const normalizedSlug = decodedSlug.replace(/\.html$/, '');

    // Create multiple search variations
    const searchVariations = [
      slug,                    // Original (encoded)
      decodedSlug,            // Decoded
      normalizedSlug,         // Decoded without .html
      slug.replace(/\.html$/, ''), // Original without .html
    ];

    console.log('🚀 === LOADING POST START ===');
    console.log('🔍 Loading post:', {
      originalSlug: slug,
      decodedSlug,
      normalizedSlug,
      searchVariations
    });

    // Step 1: Search in cache first (fast, no network)
    console.log('📦 Step 1: Searching in cache first...');
    for (const searchSlug of searchVariations) {
      const cachedPost = await findPostInCache(searchSlug);
      if (cachedPost) {
        console.log('✅ Found post in cache with variation:', searchSlug, cachedPost.title);
        const result = convertToPost(cachedPost, normalizedSlug);
        console.log('🎯 === LOADING POST SUCCESS (CACHE) ===');
        return result;
      }
    }
    console.log('❌ Post not found in cache, fetching fresh data...');

    // Step 2: Fetch fresh data only if not found in cache
    console.log('🌐 Step 2: Fetching fresh data (limited to 80 posts)...');
    const freshData = await fetchFreshData();
    if (freshData && freshData.items && freshData.items.length > 0) {
      console.log('✅ Fresh data fetched, searching in', freshData.items.length, 'posts');

      // Cache fresh data for future use
      await setCachedData(CACHE_KEYS.ATOM_POSTS, freshData);

      // Search in fresh data with all variations
      for (const searchSlug of searchVariations) {
        const freshPost = findPostInFreshData(freshData.items, searchSlug, normalizedSlug);
        if (freshPost) {
          console.log('✅ Found post in fresh data with variation:', searchSlug, freshPost.title);
          const result = convertToPost(freshPost, normalizedSlug);
          console.log('🎯 === LOADING POST SUCCESS (FRESH) ===');
          return result;
        }
      }
      console.log('❌ Post not found in fresh data either');
    } else {
      console.log('❌ Failed to fetch fresh data');
    }

    console.log('💥 === LOADING POST FAILED (NOT FOUND) ===');
    return null;
  } catch (error: any) {
    console.error('❌ Error loading post:', error);
    console.log('💥 === LOADING POST FAILED (ERROR) ===');
    return null;
  }
}

// Convert found post data to Post format
function convertToPost(foundPost: any, normalizedSlug: string): Post {
  return {
    id: foundPost.id || '',
    title: foundPost.title || '',
    slug: foundPost.slug || normalizedSlug,
    timestamp: foundPost.timestamp || Date.now(),
    url: foundPost.url || foundPost.link || '',
    content: foundPost.content || '',
    labels: foundPost.labels || [],
    published: foundPost.published || '',
    updated: foundPost.updated || ''
  };
}

// Fetch fresh data (limited to 80 posts for performance)
async function fetchFreshData(): Promise<any> {
  try {
    console.log('🔄 Fetching fresh data (limited to 80 posts)...');

    // Try to fetch 80 posts at once first
    try {
      const response = await fetchPostsSecurely({
        maxResults: 80,
        startIndex: 1,
        useCache: false // Always force fresh fetch
      });

      if (response && response.items && response.items.length > 0) {
        console.log(`✅ Fetched ${response.items.length} posts in single batch`);
        return response;
      }
    } catch (error) {
      console.warn('❌ Single batch failed, trying smaller batches:', error);
    }

    // Fallback: Try to fetch multiple smaller batches and combine them (up to 80 posts)
    const batches = [1, 21, 41, 61];
    let allItems: any[] = [];

    for (const startIndex of batches) {
      try {
        console.log(`🔄 Fetching batch starting at ${startIndex}...`);
        const response = await fetchPostsSecurely({
          maxResults: 20,
          startIndex,
          useCache: false // Always force fresh fetch
        });

        if (response && response.items && response.items.length > 0) {
          console.log(`✅ Fetched ${response.items.length} posts from batch ${startIndex}`);
          allItems = [...allItems, ...response.items];
        }
      } catch (error) {
        console.warn(`❌ Failed to fetch batch ${startIndex}:`, error);
        continue;
      }
    }

    if (allItems.length > 0) {
      console.log(`✅ Combined ${allItems.length} posts from multiple batches`);
      return { items: allItems };
    }

    return null;
  } catch (error: any) {
    console.error('❌ Error fetching fresh data:', error);
    return null;
  }
}

// Find post in fresh data with comprehensive matching including date structure
function findPostInFreshData(items: any[], originalSlug: string, normalizedSlug: string): any | null {
  console.log('🔍 Searching fresh data for:', {
    originalSlug,
    normalizedSlug,
    totalPosts: items.length
  });

  // Parse the search slug to extract year, month, and slug parts
  const searchParts = normalizedSlug.split('/');
  let searchYear = '', searchMonth = '', searchSlugPart = '';

  if (searchParts.length >= 3) {
    [searchYear, searchMonth, searchSlugPart] = searchParts;
  } else {
    searchSlugPart = normalizedSlug;
  }

  const normalizedSearchSlugPart = normalizeSlug(searchSlugPart);

  console.log('🔍 Search components:', {
    searchYear,
    searchMonth,
    searchSlugPart,
    normalizedSearchSlugPart
  });

  // Also try title-based matching for posts with complex titles
  const searchTitle = searchSlugPart.replace(/-/g, ' ').toLowerCase();

  // Debug: Show first few posts to understand data structure
  if (items.length > 0) {
    const samplePosts = items.slice(0, 5).map(post => ({
      title: post.title?.substring(0, 50) + '...',
      slug: post.slug,
      url: post.url || post.link,
      id: post.id
    }));
    console.log('📊 Sample posts structure:', samplePosts);

    // Also log the exact search we're doing
    console.log('🎯 EXACT SEARCH TARGET:', {
      originalSlug,
      normalizedSlug,
      searchYear,
      searchMonth,
      searchSlugPart,
      normalizedSearchSlugPart,
      searchTitle
    });

    // Try to find any post that contains "Saigai" in title for debugging
    const testPost = items.find(post =>
      post.title && post.title.toLowerCase().includes('saigai')
    );
    if (testPost) {
      console.log('🔍 Found test post with "Saigai":', {
        title: testPost.title,
        slug: testPost.slug,
        url: testPost.url || testPost.link
      });
    } else {
      console.log('❌ No post found with "Saigai" in title');
    }

    // Check for posts from 2022
    const posts2022 = items.filter(post => {
      const url = post.url || post.link || '';
      const slug = post.slug || '';
      return url.includes('/2022/') || slug.includes('2022/');
    });
    console.log(`📅 Found ${posts2022.length} posts from 2022:`,
      posts2022.slice(0, 3).map(p => ({ title: p.title?.substring(0, 50) + '...', slug: p.slug }))
    );
  }

  return items.find((post: any) => {
    const postSlug = post.slug || getSlugFromUrl(post.url || post.link || '');
    const postTitle = (post.title || '').toLowerCase();

    // Parse post slug to extract components
    const postParts = postSlug.split('/');
    let postYear = '', postMonth = '', postSlugPart = '';

    if (postParts.length >= 3) {
      [postYear, postMonth, postSlugPart] = postParts;
      // Remove .html extension if present
      postSlugPart = postSlugPart.replace(/\.html$/, '');
    } else {
      postSlugPart = postSlug.replace(/\.html$/, '');
    }

    const normalizedPostSlugPart = normalizeSlug(postSlugPart);

    // Enhanced matching strategies with date validation
    const matches = [
      // Exact full path matches (highest priority)
      postSlug === normalizedSlug,
      postSlug === normalizedSlug + '.html',
      postSlug.replace(/\.html$/, '') === normalizedSlug,

      // Date-aware matching (year/month/slug must all match)
      searchYear && searchMonth && searchSlugPart &&
      postYear === searchYear &&
      postMonth === searchMonth &&
      postSlugPart === searchSlugPart,

      // Date-aware with normalization
      searchYear && searchMonth && searchSlugPart &&
      postYear === searchYear &&
      postMonth === searchMonth &&
      normalizedPostSlugPart === normalizedSearchSlugPart,

      // Title-based matching for complex titles
      searchYear && searchMonth && searchTitle &&
      postYear === searchYear &&
      postMonth === searchMonth &&
      postTitle.includes(searchTitle),

      // URL-based exact matches
      post.url && post.url.includes(normalizedSlug),
      post.link && post.link.includes(normalizedSlug),

      // Fallback: slug part only (lowest priority, only if no date info)
      !searchYear && !searchMonth && normalizedPostSlugPart === normalizedSearchSlugPart,

      // Emergency fallback: partial title match
      searchTitle && postTitle.includes(searchTitle),

      // Emergency fallback: partial slug match
      searchSlugPart && (postSlugPart.includes(searchSlugPart) || searchSlugPart.includes(postSlugPart))
    ];

    const isMatch = matches.some(Boolean);
    const matchIndex = matches.findIndex(Boolean);

    // Debug each post being checked (only log matches or first few for debugging)
    if (isMatch || items.indexOf(post) < 3) {
      console.log(`${isMatch ? '🎯' : '❌'} Checking post:`, {
        title: post.title?.substring(0, 50) + '...',
        postSlug,
        postComponents: { postYear, postMonth, postSlugPart },
        searchComponents: { searchYear, searchMonth, searchSlugPart },
        normalizedPost: normalizedPostSlugPart,
        normalizedSearch: normalizedSearchSlugPart,
        matchType: isMatch ? matchIndex : 'no match',
        isMatch
      });
    }

    if (isMatch) {
      console.log('✅ EXACT POST MATCH FOUND:', {
        searchSlug: normalizedSlug,
        postSlug,
        postTitle: post.title,
        matchType: matchIndex,
        matchDescription: [
          'Exact slug match',
          'Exact slug + .html',
          'Exact slug without .html',
          'Date + slug exact match',
          'Date + slug normalized match',
          'Date + title match',
          'URL contains slug',
          'Link contains slug',
          'Slug part only (no date)',
          'Partial title match',
          'Partial slug match'
        ][matchIndex]
      });
    }

    return isMatch;
  });
}
