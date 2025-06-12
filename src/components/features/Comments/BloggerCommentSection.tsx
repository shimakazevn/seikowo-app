import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Button,
  useToast,
  useColorMode,
  Tooltip,
  Avatar,
} from '@chakra-ui/react';
import { FaComments, FaExternalLinkAlt, FaSync, FaComment } from 'react-icons/fa';
import { blogConfig } from '../../../config';

interface Comment {
  id: string;
  author: {
    displayName: string;
    image?: {
      url: string;
    };
  };
  content: string;
  published: string;
  updated?: string;
  parentId?: string;
  replies?: Comment[];
  isReply?: boolean;
  parentComment?: Comment;
}

interface CommentsData {
  totalItems: number;
  items: Comment[];
}

// Component for rendering a comment with its replies
const CommentWithReplies = ({
  comment,
  level,
  isLast,
  isNewComment,
  isDark,
  textColor,
  mutedColor,
  accentColor,
}: {
  comment: Comment;
  level: number;
  isLast: boolean;
  isNewComment: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) => {
  const currentLevel = level || 0;
  const replies = comment.replies || [];

  return (
    <>
      <Box
        pl={currentLevel * 4}
        borderLeft={currentLevel > 0 ? `2px solid ${accentColor}` : 'none'}
        opacity={isNewComment ? 0.8 : 1}
        transition="opacity 0.3s ease"
      >
        <HStack align="start" spacing={4}>
          {/* Avatar */}
          <Box>
            <Avatar
              size="sm"
              name={comment.author?.displayName || 'Anonymous'}
              src={comment.author?.image?.url}
              bg={isDark ? 'gray.700' : 'gray.200'}
            />
          </Box>

          {/* Comment Content */}
          <VStack align="start" spacing={2} flex={1}>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                {comment.author?.displayName || 'Anonymous'}
              </Text>
              <Text fontSize="xs" color={mutedColor}>
                {comment.published ? new Date(comment.published).toLocaleDateString() : ''}
              </Text>
              {level > 0 && (
                <Text fontSize="xs" color={accentColor}>
                  Reply
                </Text>
              )}
            </HStack>
            <Text
              fontSize="sm"
              color={textColor}
              lineHeight="1.5"
              dangerouslySetInnerHTML={{ __html: comment.content || 'No content' }}
            />
          </VStack>
        </HStack>
      </Box>

      {/* Replies */}
      {replies.length > 0 && (
        <>
          {replies.map((reply: Comment, replyIndex: number) => (
            <CommentWithReplies
              key={reply.id || `${comment.id}-reply-${replyIndex}`}
              comment={reply}
              level={currentLevel + 1}
              isLast={replyIndex === replies.length - 1 && isLast}
              isNewComment={false}
              isDark={isDark}
              textColor={textColor}
              mutedColor={mutedColor}
              accentColor={accentColor}
            />
          ))}
        </>
      )}
    </>
  );
};

interface BloggerCommentSectionProps {
  postId: string;
  postUrl?: string;
  title?: string;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}

const BloggerCommentSection: React.FC<BloggerCommentSectionProps> = ({
  postId,
  postUrl,
  title = 'Comments',
  isDark,
  textColor,
  mutedColor,
  accentColor
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [commentsData, setCommentsData] = useState<CommentsData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newCommentAdded, setNewCommentAdded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toast = useToast();
  const { colorMode } = useColorMode();

  // Clean theme colors
  const bgColor = isDark ? '#131313' : '#f4f4f4';

  const COMMENTS_PER_PAGE = 50; // Increased from 4 to 50

  // Extract clean post ID
  const cleanPostId = postId?.includes('.post-')
    ? postId.split('.post-')[1]
    : postId?.includes('/')
    ? postId.split('/').pop() || postId
    : postId;

  // Thay đổi cách tạo URL iframe
  const commentIframeUrl = useMemo(() => {
    if (!postUrl) return '';
    const url = new URL(postUrl);
    url.searchParams.set('showcommentframe', 'true');
    url.searchParams.set('embedCommentForm', 'true');
    return url.toString();
  }, [postUrl]);

  // Simple iframe load handler (no styling attempts)
  const applyIframeDarkMode = () => {
    console.log('🔄 Iframe loaded - CORS prevents styling, using container approach');
    // Since CORS blocks all styling attempts, we'll rely on container styling
    // and accept that iframe content will use Blogger's default styling
  };

  // Parse comments from ATOM feed
  const parseCommentsFromAtom = (xmlText: string) => {
    try {
      console.log('🔍 Parsing ATOM XML, length:', xmlText.length);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.warn('❌ XML parsing error:', parserError.textContent);
        return { totalItems: 0, items: [] };
      }

      const entries = xmlDoc.querySelectorAll('entry');
      console.log('📝 Found entries:', entries.length);

      const comments = Array.from(entries).map((entry, index) => {
        const id = entry.querySelector('id')?.textContent || '';
        const title = entry.querySelector('title')?.textContent || '';
        const content = entry.querySelector('content')?.textContent ||
                      entry.querySelector('summary')?.textContent ||
                      'No content';
        const published = entry.querySelector('published')?.textContent || '';
        const updated = entry.querySelector('updated')?.textContent || '';

        // Extract author info with avatar
        const authorElement = entry.querySelector('author');
        const authorName = authorElement?.querySelector('name')?.textContent || 'Anonymous';
        const authorUri = authorElement?.querySelector('uri')?.textContent || '';

        // Try to extract avatar from various sources
        let avatarUrl = 'https://www.blogger.com/img/blogger_logo_round_35.png'; // fallback

        // Method 1: Look for gd:image in author
        const gdImage = authorElement?.querySelector('gd\\:image, image');
        if (gdImage) {
          const src = gdImage.getAttribute('src');
          if (src && !src.includes('blogger_logo')) {
            avatarUrl = src;
          }
        }

        // Method 2: Look for link with rel="photo"
        const photoLink = authorElement?.querySelector('link[rel="photo"]');
        if (photoLink) {
          const href = photoLink.getAttribute('href');
          if (href) avatarUrl = href;
        }

        // Method 3: Extract from content if it contains img tags
        if (content.includes('<img')) {
          const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
          if (imgMatch && imgMatch[1] && imgMatch[1].includes('googleusercontent')) {
            avatarUrl = imgMatch[1];
          }
        }

        // Method 4: Generate Gravatar-style avatar from email/name
        if (avatarUrl.includes('blogger_logo') && authorUri) {
          // Try to extract Google profile image from URI
          if (authorUri.includes('profiles.google.com') || authorUri.includes('plus.google.com')) {
            const profileId = authorUri.split('/').pop();
            if (profileId) {
              avatarUrl = `https://lh3.googleusercontent.com/a/default-user=s35-c`;
            }
          }
        }

        const comment = {
          id: id.split('.post-')[1] || id,
          content,
          published,
          updated,
          author: {
            displayName: authorName,
            url: authorUri,
            image: {
              url: avatarUrl
            }
          }
        };

        console.log(`📝 Parsed comment ${index + 1}:`, comment);
        return comment;
      });

      const result = {
        totalItems: comments.length,
        items: comments
      };

      console.log('✅ Final parsed result:', result);
      return result;
    } catch (error) {
      console.warn('❌ Error parsing comment ATOM feed:', error);
      return { totalItems: 0, items: [] };
    }
  };

  // Parse comments from JSON response (Blogger JSON API v2)
  const parseCommentsFromJson = (jsonData: any) => {
    try {
      console.log('🔍 JSON structure:', jsonData);

      const feed = jsonData.feed || {};
      const entries = feed.entry || [];

      console.log('📊 JSON entries found:', entries.length);

      const items = entries.map((entry: any, index: number) => {
        // Extract comment ID
        const id = entry.id?.$t || entry.id || `comment-${index}`;

        // Extract content
        const content = entry.content?.$t || entry.content || '';

        // Extract author info
        const author = entry.author?.[0] || {};
        const authorName = author.name?.$t || author.displayName?.$t || 'Anonymous';
        const authorUri = author.uri?.$t || '';

        // Extract published date
        const published = entry.published?.$t || entry.published || new Date().toISOString();

        // Extract updated date
        const updated = entry.updated?.$t || entry.updated || published;

        // Extract avatar URL
        let avatarUrl = 'https://www.blogger.com/img/blogger_logo_round_35.png';
        if (entry.author && Array.isArray(entry.author) && entry.author[0]) {
          const author = entry.author[0];
          if (author['gd$image'] && author['gd$image'].src) {
            const src = author['gd$image'].src;
            if (src && !src.includes('blogger_logo')) {
              avatarUrl = src;
            }
          }
        }

        // Extract parent comment ID for threading (from thr:in-reply-to)
        let parentId = null;
        if (entry['thr$in-reply-to']) {
          const inReplyTo = entry['thr$in-reply-to'];
          if (inReplyTo.ref) {
            parentId = inReplyTo.ref;
          }
        }

        console.log(`📝 JSON Comment ${index + 1}:`, {
          id: id.substring(0, 50) + '...',
          author: authorName,
          content: content.substring(0, 100) + '...',
          published,
          hasContent: !!content,
          parentId,
          avatarUrl
        });

        return {
          id,
          content: content || 'No content available',
          author: {
            displayName: authorName,
            uri: authorUri,
            image: {
              url: avatarUrl
            }
          },
          published,
          updated,
          parentId // Add parent ID for threading
        };
      });

      return {
        totalItems: items.length,
        items
      };
    } catch (error) {
      console.error('❌ Error parsing JSON comments:', error);
      return { totalItems: 0, items: [] };
    }
  };

  // Organize comments into threaded structure
  const organizeCommentsIntoThreads = (comments: Comment[]) => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: Create map of all comments
    comments.forEach((comment: Comment) => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: Organize into parent-child relationships
    comments.forEach((comment: Comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // This is a reply - add to parent's replies
        const parent = commentMap.get(comment.parentId)!;
        parent.replies!.push(comment);
        comment.isReply = true;
        comment.parentComment = parent;
      } else {
        // This is a root comment
        rootComments.push(comment);
        comment.isReply = false;
      }
    });

    // Sort replies by date (oldest first for natural conversation flow)
    const sortCommentsByDate = (commentList: Comment[]) => {
      commentList.sort((a: Comment, b: Comment) => 
        new Date(a.published).getTime() - new Date(b.published).getTime()
      );
      commentList.forEach((comment: Comment) => {
        if (comment.replies && comment.replies.length > 0) {
          sortCommentsByDate(comment.replies);
        }
      });
    };

    sortCommentsByDate(rootComments);
    return rootComments;
  };

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  // Thêm ref để theo dõi lần fetch cuối
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN = 5000; // 5 giây cooldown giữa các lần fetch

  // Sửa lại hàm fetchComments
  const fetchComments = async (silent = false) => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) {
      console.log('⏳ Skipping fetch - cooldown period');
      return;
    }

    try {
      if (!silent) setIsLoading(true);
      console.log('🔄 Fetching comments for post:', cleanPostId);
      console.log(`🌍 Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);

      // Use the specific URL format that should only return comments for this post
      const feedUrls = [
        `https://seikowo-app.blogspot.com/feeds/${cleanPostId}/comments/default?max-results=500`,
        `https://seikowo-app.blogspot.com/feeds/comments/default?postId=${cleanPostId}&max-results=500`,
      ];

      for (const feedUrl of feedUrls) {
        console.log('🔄 Trying comment feed:', feedUrl);

        try {
          let response;
          let usedProxy = false;

          if (isDevelopment) {
            // DEVELOPMENT: Use proxy first
            console.log('🔧 DEV MODE: Using proxy first...');
            const proxyUrl = `/api/atom-proxy?url=${encodeURIComponent(feedUrl)}`;
            console.log('🌐 Proxy URL:', proxyUrl);

            try {
              response = await fetch(proxyUrl);
              usedProxy = true;
              console.log('📊 Proxy fetch response:', response.status, response.statusText);
            } catch (proxyError) {
              console.log('❌ Proxy fetch error:', proxyError);
              // Fallback to direct fetch in dev if proxy fails
              console.log('🔄 Proxy failed, trying direct fetch as fallback...');
              try {
                response = await fetch(feedUrl, {
                  headers: {
                    'Accept': 'application/atom+xml, application/xml, text/xml, */*',
                    'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
                    'Origin': window.location.origin
                  },
                  mode: 'cors'
                });
                console.log('📊 Direct fetch fallback response:', response.status, response.statusText);
              } catch (directError) {
                console.log('❌ Direct fetch fallback error:', directError);
                response = { ok: false, status: 0 } as any;
              }
            }
          } else {
            // PRODUCTION: Use direct fetch with proper headers
            console.log('🚀 PRODUCTION MODE: Using direct fetch...');
            try {
              response = await fetch(feedUrl, {
                headers: {
                  'Accept': 'application/atom+xml, application/xml, text/xml, */*',
                  'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
                  'Origin': window.location.origin
                },
                mode: 'cors',
                credentials: 'omit' // Don't send cookies for cross-origin requests
              });
              console.log('📊 Direct fetch response:', response.status, response.statusText);
            } catch (directError) {
              console.log('❌ Direct fetch error:', directError);
              // Try alternative URL format if first attempt fails
              try {
                const altFeedUrl = feedUrl.replace('/feeds/', '/feeds/posts/');
                console.log('🔄 Trying alternative feed URL:', altFeedUrl);
                response = await fetch(altFeedUrl, {
                  headers: {
                    'Accept': 'application/atom+xml, application/xml, text/xml, */*',
                    'User-Agent': 'Mozilla/5.0 (compatible; BlogReader/1.0)',
                    'Origin': window.location.origin
                  },
                  mode: 'cors',
                  credentials: 'omit'
                });
                console.log('📊 Alternative URL fetch response:', response.status, response.statusText);
              } catch (altError) {
                console.log('❌ Alternative URL fetch error:', altError);
                response = { ok: false, status: 0 } as any;
              }
            }
          }

          if (response.ok && 'text' in response) {
            console.log(`✅ ${usedProxy ? 'Proxy' : 'Direct'} fetch successful!`);
            const contentType = response.headers.get('content-type') || '';
            const isJsonResponse = feedUrl.includes('alt=json') || contentType.includes('application/json');

            let commentsData;

            if (isJsonResponse) {
              // Handle JSON response
              console.log('📄 Parsing JSON response...');
              const jsonContent = await response.text();
              console.log('📄 JSON content length:', jsonContent.length);
              console.log('📄 JSON preview:', jsonContent.substring(0, 200) + '...');

              try {
                const jsonData = JSON.parse(jsonContent);
                commentsData = parseCommentsFromJson(jsonData);
                console.log('🔍 JSON parsed comments data:', commentsData);
              } catch (jsonError) {
                console.warn('❌ JSON parsing failed:', jsonError);
                continue; // Try next feed URL
              }
            } else {
              // Handle XML response
              console.log('📄 Parsing XML response...');
              const xmlContent = await response.text();
              console.log('📄 XML content length:', xmlContent.length);
              console.log('📄 XML preview:', xmlContent.substring(0, 200) + '...');

              if (xmlContent && xmlContent.trim()) {
                try {
                  commentsData = parseCommentsFromAtom(xmlContent);
                  console.log('🔍 XML parsed comments data:', commentsData);
                } catch (parseError) {
                  console.warn('❌ XML parsing failed:', parseError);
                  continue; // Try next feed URL
                }
              } else {
                console.warn('⚠️ Empty XML content received');
                continue;
              }
            }

            if (commentsData && commentsData.items) {
              console.log('🔍 All comments count:', commentsData.items.length);
              console.log('🎯 Looking for post ID:', cleanPostId);
              console.log('📊 Feed URL used:', feedUrl);
              console.log('📊 Response type:', isJsonResponse ? 'JSON' : 'XML');

              // Filter comments by post ID if we got all comments
              let filteredItems = commentsData.items;

              // Debug: Log all comments first
              console.log(`📊 Total comments received: ${commentsData.items.length}`);
              console.log(`🎯 Looking for comments for post: ${cleanPostId}`);

              // Try different filtering strategies
              if (commentsData.items.length > 0 && cleanPostId) {
                // Strategy 1: Strict filtering
                const strictFiltered = commentsData.items.filter((comment: Comment) => {
                  const commentId = comment.id || '';
                  const isForThisPost = commentId.includes(cleanPostId) ||
                                       commentId.includes(`post-${cleanPostId}`) ||
                                       commentId.endsWith(cleanPostId);
                  return isForThisPost;
                });

                // Strategy 2: Loose filtering (check if URL was post-specific)
                const isPostSpecificUrl = feedUrl.includes(`/${cleanPostId}/`) || feedUrl.includes(`postId=${cleanPostId}`);

                console.log(`🔍 Filtering results:`);
                console.log(`- Strict filtered: ${strictFiltered.length} comments`);
                console.log(`- URL is post-specific: ${isPostSpecificUrl}`);
                console.log(`- Feed URL used: ${feedUrl}`);

                if (strictFiltered.length > 0) {
                  console.log(`✅ Using strict filtered comments (${strictFiltered.length})`);
                  filteredItems = strictFiltered;
                } else if (isPostSpecificUrl && commentsData.items.length > 0) {
                  console.log(`✅ Using all comments from post-specific URL (${commentsData.items.length})`);
                  filteredItems = commentsData.items; // Trust the URL filtering
                } else {
                  console.log(`⚠️ No comments found for this post, showing all for debugging`);
                  filteredItems = commentsData.items; // Show all for debugging
                }
              }

              // Organize comments into threaded structure if they have parentId
              const organizedComments = organizeCommentsIntoThreads(filteredItems);

              const filteredComments = {
                totalItems: organizedComments.length,
                items: organizedComments
              };

              // Log each comment for debugging
              console.log(`📊 Raw comments received from ${feedUrl}:`, commentsData.items.length);
              commentsData.items.forEach((comment: any, index: number) => {
                console.log(`📝 Comment ${index + 1}:`, {
                  id: comment.id,
                  content: comment.content?.substring(0, 100) + '...',
                  author: comment.author?.displayName,
                  published: comment.published,
                  isForThisPost: comment.id?.includes(cleanPostId)
                });
              });

              console.log(`✅ Comments fetched via ${usedProxy ? 'PROXY' : 'DIRECT'}:`, filteredComments);
              console.log('📊 Total comments found:', filteredComments.totalItems);

              // Check for new comments and add animation
              if (commentsData && filteredComments.totalItems > commentsData.totalItems) {
                console.log('🎉 New comment detected! Adding animation...');
                setNewCommentAdded(true);
                setTimeout(() => {
                  setNewCommentAdded(false);
                  console.log('✨ Animation completed');
                }, 2000);

                // Comment animation completed - no toast needed
              }

              setCommentsData(filteredComments);
              return;
            } else {
              console.warn('⚠️ Empty XML content received');
            }
          } else {
            console.warn(`❌ ${usedProxy ? 'Proxy' : 'Direct'} fetch failed:`, response.status, response.statusText);
          }
        } catch (error) {
          console.warn('❌ Feed fetch failed:', feedUrl, error);
          continue; // Try next feed URL
        }
      }

      // Strategy 2: Empty state fallback
      console.log('📭 No comments found or all methods failed');
      if (!silent) {
        setCommentsData({
          totalItems: 0,
          items: []
        });
      }

    } catch (error) {
      console.warn('❌ Could not fetch comments:', error);
      if (!silent) {
        setCommentsData({
          totalItems: 0,
          items: []
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }

    lastFetchTimeRef.current = now;
  };

  // Scroll to specific comment by ID
  const scrollToComment = (commentId: string) => {
    console.log('🎯 Scrolling to comment:', commentId);

    // Try different possible element selectors for the comment
    const possibleSelectors = [
      `[data-comment-id="${commentId}"]`,
      `[id*="${commentId}"]`,
      `[key="${commentId}"]`,
      `[data-id="${commentId}"]`
    ];

    let commentElement = null;

    for (const selector of possibleSelectors) {
      commentElement = document.querySelector(selector);
      if (commentElement) {
        console.log('✅ Found comment element with selector:', selector);
        break;
      }
    }

    // If not found by selectors, try to find by content or other attributes
    if (!commentElement) {
      console.log('🔍 Searching for comment in DOM...');
      // Look for comment containers and check their content
      const commentContainers = document.querySelectorAll('[data-testid*="comment"], .comment, [class*="comment"]');
      for (const container of commentContainers) {
        if (container.textContent?.includes(commentId) ||
            container.innerHTML?.includes(commentId) ||
            container.getAttribute('key')?.includes(commentId)) {
          commentElement = container;
          console.log('✅ Found comment element by content search');
          break;
        }
      }
    }

    if (commentElement) {
      console.log('🎯 Scrolling to comment element...');
      commentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      // Add highlight effect
      const htmlElement = commentElement as HTMLElement;
      htmlElement.style.transition = 'background-color 0.5s ease';
      htmlElement.style.backgroundColor = isDark ? '#1a4d4d' : '#e6fffa';

      setTimeout(() => {
        htmlElement.style.backgroundColor = '';
      }, 3000);

      // Comment found and scrolled - no toast needed
    } else {
      console.warn('❌ Could not find comment element for ID:', commentId);
      toast({
        title: 'Comment posted',
        description: 'Your comment was posted but could not be located for scrolling',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Thêm state để theo dõi polling
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanupPolling = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  // Sửa lại handleIframeLoad
  const handleIframeLoad = () => {
    console.log('🔄 Iframe loaded, setting up comment detection...');
    applyIframeDarkMode();

    // Check for comment success in current URL
    const checkCurrentUrlForComment = () => {
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      if (urlParams.has('sc') || hash.startsWith('#c')) {
        console.log('🎉 Comment success detected in URL!');
        
        if (hash.startsWith('#c')) {
          const commentId = hash.substring(2);
          console.log('📝 New comment ID:', commentId);

          const waitAndScrollToComment = async () => {
            if (!isLoading) {
              console.log('🔄 Fetching comments to find new comment...');
              await fetchComments(true);
              setTimeout(() => {
                scrollToComment(commentId);
              }, 500);
            }
          };

          waitAndScrollToComment();
        }

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    };

    // Start polling for new comments with timeout
    const startCommentPolling = () => {
      if (isPolling || isLoading) {
        console.log('⏹️ Polling or loading in progress, skipping...');
        return;
      }

      console.log('🎯 Starting comment polling...');
      setIsPolling(true);

      pollingIntervalRef.current = setInterval(async () => {
        if (!isLoading) {
          console.log('🔄 Polling for new comments...');
          await fetchComments(true);
        }
      }, FETCH_COOLDOWN);

      pollingTimeoutRef.current = setTimeout(() => {
        console.log('⏹️ Stopping comment polling after timeout');
        cleanupPolling();
      }, 30000);

      return pollingIntervalRef.current;
    };

    // Check current URL immediately
    checkCurrentUrlForComment();

    // Method 1: Listen for iframe URL changes
    let lastUrl = '';
    const checkUrlChange = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          const currentUrl = iframe.contentWindow.location.href;
          if (currentUrl !== lastUrl && (currentUrl.includes('#c') || currentUrl.includes('comment'))) {
            console.log('🎯 Comment URL detected, starting polling...');
            startCommentPolling();
          }
          lastUrl = currentUrl;
        }
      } catch (error) {
        // CORS will block this, but worth trying
      }
    };

    // Method 2: Listen for window focus
    const handleWindowFocus = () => {
      if (!isPolling && !isLoading) {
        console.log('👁️ Window focused, checking for new comments...');
        fetchComments(true);
      }
    };

    const urlCheckInterval = setInterval(checkUrlChange, 1000);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(urlCheckInterval);
      window.removeEventListener('focus', handleWindowFocus);
      cleanupPolling();
    };
  };

  // Scroll to comment form
  const scrollToCommentForm = () => {
    console.log('🎯 Scrolling to comment form...');

    // Find the comment form container first
    const commentFormContainer = document.querySelector('[data-testid="comment-form"]');
    if (commentFormContainer) {
      commentFormContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      // Focus the iframe after scrolling
      setTimeout(() => {
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.focus();
        }
      }, 500);
    } else {
      console.warn('❌ Could not find comment form container');
    }
  };

  // Sửa lại useEffect cho initial load
  useEffect(() => {
    let mounted = true;

    const initialFetch = async () => {
      if (!cleanPostId || cleanPostId === 'demo-manga') {
        setIsLoading(false);
        setCommentsData({ totalItems: 0, items: [] });
        return;
      }

      if (mounted) {
        await fetchComments();
      }
    };

    initialFetch();

    return () => {
      mounted = false;
    };
  }, [cleanPostId]); // Chỉ phụ thuộc vào cleanPostId

  // Apply dark mode when color mode changes
  useEffect(() => {
    if (iframeRef.current) {
      setTimeout(() => applyIframeDarkMode(), 100);
    }
  }, [colorMode]);

  // Get paginated comments
  const paginatedComments = commentsData?.items?.slice(0, currentPage * COMMENTS_PER_PAGE) || [];
  const hasMoreComments = (commentsData?.items?.length || 0) > currentPage * COMMENTS_PER_PAGE;

  if (!cleanPostId) {
    return (
      <Box p={6}>
        <Text fontSize="sm" color={mutedColor}>
          Comments unavailable - Invalid post ID
        </Text>
      </Box>
    );
  }

  // Add CSS keyframes for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
      @keyframes slideInFromTop {
        0% { transform: translateY(-30px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Sửa lại handleRefresh
  const handleRefresh = async () => {
    if (isLoading) {
      console.log('⏳ Skipping refresh - already loading');
      return;
    }
    await fetchComments();
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Clean Header */}
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <FaComments size={16} color={accentColor} />
          <Text fontSize="lg" fontWeight="medium" color={textColor}>
            {title}
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            ({commentsData?.totalItems ?? 0})
          </Text>
        </HStack>

        <HStack spacing={2}>
          <Tooltip label="Check for new comments">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              isLoading={isLoading}
              color={mutedColor}
              _hover={{ color: accentColor }}
              leftIcon={<FaSync />}
            >
              Check
            </Button>
          </Tooltip>

          <Tooltip label="Scroll to comment form">
            <Button
              size="sm"
              variant="ghost"
              onClick={scrollToCommentForm}
              color={mutedColor}
              _hover={{ color: textColor }}
            >
              Comment
            </Button>
          </Tooltip>
        </HStack>
      </HStack>

      {/* Comment Form */}
      {postUrl && (
        <Box
          borderRadius="8px"
          overflow="hidden"
          data-testid="comment-form"
          display="none" // Ẩn iframe vì nó gây ra lỗi CSP
        >
          <iframe
            ref={iframeRef}
            src={commentIframeUrl}
            width="100%"
            height="200"
            title="Add Comment"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            onLoad={handleIframeLoad}
          />
        </Box>
      )}

      {/* Thay thế bằng nút mở form bình luận trong tab mới */}
      {postUrl && (
        <Button
          leftIcon={<FaComment />}
          colorScheme="blue"
          variant="outline"
          onClick={() => window.open(postUrl, '_blank')}
          size="md"
          width="full"
        >
          Thêm bình luận
        </Button>
      )}

      {/* Comments List */}
      <VStack spacing={4} align="stretch">
        {isLoading ? (
          <HStack justify="center" py={8}>
            <Spinner size="md" color={accentColor} />
            <Text fontSize="sm" color={mutedColor}>Loading comments...</Text>
          </HStack>
        ) : !commentsData || commentsData.totalItems === 0 ? (
          <VStack spacing={3} py={8}>
            <FaComments size={24} color={mutedColor} />
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              No comments yet. Be the first to share your thoughts!
            </Text>
          </VStack>
        ) : (
          <>
            {paginatedComments.map((comment: Comment, index: number) => (
              <CommentWithReplies
                key={comment.id || index}
                comment={comment}
                level={0}
                isLast={index === paginatedComments.length - 1}
                isNewComment={newCommentAdded && index === 0}
                isDark={isDark}
                textColor={textColor}
                mutedColor={mutedColor}
                accentColor={accentColor}
              />
            ))}

            {hasMoreComments && commentsData && (
              <HStack spacing={2} justify="center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  color={mutedColor}
                  _hover={{ color: textColor }}
                >
                  Load more ({(commentsData?.totalItems ?? 0) - paginatedComments.length} remaining)
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.ceil((commentsData?.totalItems ?? 0) / COMMENTS_PER_PAGE))}
                  color={accentColor}
                  _hover={{ color: textColor }}
                >
                  Show all
                </Button>
              </HStack>
            )}
          </>
        )}
      </VStack>

    </VStack>
  );
};

export default BloggerCommentSection;
