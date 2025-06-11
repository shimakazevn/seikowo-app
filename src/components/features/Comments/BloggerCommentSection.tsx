import React, { useState, useEffect, useRef } from 'react';
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
} from '@chakra-ui/react';
import { FaComments, FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import { blogConfig } from '../../config';

// Component for rendering a comment with its replies
const CommentWithReplies = ({
  comment,
  level = 0,
  isLast = false,
  isNewComment = false,
  isDark,
  textColor,
  mutedColor,
  accentColor
}: {
  comment: any;
  level: number;
  isLast: boolean;
  isNewComment: boolean;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}) => {
  const indentSize = level * 20; // 20px per level
  const maxLevel = 3; // Maximum nesting level
  const currentLevel = Math.min(level, maxLevel);

  return (
    <>
      {/* Main Comment */}
      <Box
        data-comment-id={comment.id}
        data-testid={`comment-${comment.id}`}
        py={4}
        pl={indentSize}
        borderBottom={isLast && (!comment.replies || comment.replies.length === 0) ? "none" : "1px solid"}
        borderColor={isDark ? "#333" : "#e2e8f0"}
        borderLeft={level > 0 ? "2px solid" : "none"}
        borderLeftColor={level > 0 ? (isDark ? "#444" : "#e2e8f0") : "transparent"}
        bg={level > 0 ? (isDark ? '#0a0a0a' : '#fafafa') : 'transparent'}
        position="relative"
        style={{
          transform: isNewComment ? "translateY(-20px) scale(1.02)" : "translateY(0) scale(1)",
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isNewComment ? 0.9 : 1,
          backgroundColor: isNewComment ? (isDark ? '#1a4d4d' : '#e6fffa') : (level > 0 ? (isDark ? '#0a0a0a' : '#fafafa') : 'transparent'),
          borderRadius: isNewComment ? '8px' : '0px',
          marginBottom: isNewComment ? '8px' : '0',
          boxShadow: isNewComment ? (isDark ? '0 4px 12px rgba(0, 212, 255, 0.2)' : '0 4px 12px rgba(49, 130, 206, 0.2)') : 'none',
        }}
      >
        {/* New comment indicator */}
        {isNewComment && (
          <Box
            position="absolute"
            top={2}
            right={2}
            bg={accentColor}
            color="white"
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
            fontWeight="bold"
            style={{
              animation: 'pulse 2s infinite',
            }}
          >
            NEW
          </Box>
        )}

        <HStack spacing={3} align="start">
          <Box
            w={8}
            h={8}
            borderRadius="full"
            overflow="hidden"
            flexShrink={0}
            bg={accentColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <img
              src={comment.author?.image?.url || 'https://www.blogger.com/img/blogger_logo_round_35.png'}
              alt={comment.author?.displayName || 'User'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div style="
                      width: 100%;
                      height: 100%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background-color: ${accentColor};
                      color: white;
                      font-size: 12px;
                      font-weight: bold;
                      border-radius: 50%;
                    ">
                      ${comment.author?.displayName?.charAt(0) || 'A'}
                    </div>
                  `;
                }
              }}
            />
          </Box>
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
      {comment.replies && comment.replies.length > 0 && (
        <>
          {comment.replies.map((reply: any, replyIndex: number) => (
            <CommentWithReplies
              key={reply.id || `${comment.id}-reply-${replyIndex}`}
              comment={reply}
              level={currentLevel + 1}
              isLast={replyIndex === comment.replies.length - 1 && isLast}
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
}

const BloggerCommentSection: React.FC<BloggerCommentSectionProps> = ({
  postId,
  postUrl,
  title = 'Comments'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [commentsData, setCommentsData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newCommentAdded, setNewCommentAdded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toast = useToast();
  const { colorMode } = useColorMode();

  // Clean theme colors
  const isDark = colorMode === 'dark';
  const bgColor = isDark ? '#131313' : '#f4f4f4';
  const textColor = isDark ? '#ffffff' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const accentColor = isDark ? '#00d4ff' : '#3182ce';

  const COMMENTS_PER_PAGE = 50; // Increased from 4 to 50

  // Extract clean post ID
  const cleanPostId = postId?.includes('.post-')
    ? postId.split('.post-')[1]
    : postId?.includes('/')
    ? postId.split('/').pop() || postId
    : postId;

  // Blogger comment iframe URL with custom styling
  const blogId = blogConfig.blogId; // Your blog ID
  const commentIframeUrl = `https://www.blogger.com/comment-iframe.g?blogID=${blogId}&postID=${cleanPostId}`;

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
  const organizeCommentsIntoThreads = (comments: any[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: Create map of all comments
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    // Second pass: Organize into parent-child relationships
    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        // This is a reply - add to parent's replies
        const parent = commentMap.get(comment.parentId);
        parent.replies.push(comment);
        comment.isReply = true;
        comment.parentComment = parent;
      } else {
        // This is a root comment
        rootComments.push(comment);
        comment.isReply = false;
      }
    });

    // Sort replies by date (oldest first for natural conversation flow)
    const sortCommentsByDate = (commentList: any[]) => {
      commentList.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
      commentList.forEach(comment => {
        if (comment.replies.length > 0) {
          sortCommentsByDate(comment.replies);
        }
      });
    };

    sortCommentsByDate(rootComments);
    return rootComments;
  };

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  // Optimized comment fetching with environment-based strategy
  const fetchComments = async (silent = false) => {
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
                response = await fetch(feedUrl);
                console.log('📊 Direct fetch fallback response:', response.status, response.statusText);
              } catch (directError) {
                console.log('❌ Direct fetch fallback error:', directError);
                response = { ok: false, status: 0 } as any;
              }
            }
          } else {
            // PRODUCTION: Use direct fetch only
            console.log('🚀 PRODUCTION MODE: Using direct fetch...');
            try {
              response = await fetch(feedUrl);
              console.log('📊 Direct fetch response:', response.status, response.statusText);
            } catch (directError) {
              console.log('❌ Direct fetch error:', directError);
              response = { ok: false, status: 0 } as any;
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
              // Handle XML response (original method)
              console.log('📄 Parsing XML response...');
              const xmlContent = await response.text();
              console.log('📄 XML content length:', xmlContent.length);
              console.log('📄 XML preview:', xmlContent.substring(0, 200) + '...');

              if (xmlContent && xmlContent.trim()) {
                commentsData = parseCommentsFromAtom(xmlContent);
                console.log('🔍 XML parsed comments data:', commentsData);
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
                const strictFiltered = commentsData.items.filter(comment => {
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

  // Enhanced comment detection system
  const handleIframeLoad = () => {
    console.log('🔄 Iframe loaded, setting up comment detection...');
    applyIframeDarkMode();

    // Check for comment success in current URL
    const checkCurrentUrlForComment = () => {
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      // Check for Blogger comment success indicators
      if (urlParams.has('sc') || hash.startsWith('#c')) {
        console.log('🎉 Comment success detected in URL!');
        console.log('- URL:', currentUrl);
        console.log('- SC param:', urlParams.get('sc'));
        console.log('- Comment hash:', hash);

        // Extract comment ID from hash
        if (hash.startsWith('#c')) {
          const commentId = hash.substring(2); // Remove '#c'
          console.log('📝 New comment ID:', commentId);

          // Comment posted - will scroll automatically, no toast needed

          // Wait for comments to be fetched, then scroll to the new comment
          const waitAndScrollToComment = async () => {
            console.log('🔄 Fetching comments to find new comment...');
            await fetchComments(true); // Silent refresh

            // Wait a bit for DOM to update
            setTimeout(() => {
              scrollToComment(commentId);
            }, 500);
          };

          waitAndScrollToComment();
        }

        // Clean URL (optional - remove success parameters)
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    };

    // Start aggressive polling for new comments
    const startCommentPolling = () => {
      console.log('🎯 Starting comment polling...');

      const pollInterval = setInterval(async () => {
        console.log('🔄 Polling for new comments...');
        await fetchComments(true); // Silent refresh
      }, 2000); // Check every 2 seconds

      // Stop polling after 60 seconds
      setTimeout(() => {
        console.log('⏹️ Stopping comment polling');
        clearInterval(pollInterval);
      }, 60000);

      return pollInterval;
    };

    // Check current URL immediately
    checkCurrentUrlForComment();

    // Method 1: Listen for iframe URL changes (indicates redirect after comment)
    let lastUrl = '';
    const checkUrlChange = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          const currentUrl = iframe.contentWindow.location.href;
          if (currentUrl !== lastUrl) {
            console.log('🔄 Iframe URL changed:', currentUrl);
            if (currentUrl.includes('#c') || currentUrl.includes('comment')) {
              console.log('🎯 Comment URL detected, starting polling...');
              startCommentPolling();

              // Comment submitted - polling started, no toast needed
            }
            lastUrl = currentUrl;
          }
        }
      } catch (error) {
        // CORS will block this, but worth trying
      }
    };

    // Method 2: Listen for window focus (user might return after commenting)
    const handleWindowFocus = () => {
      console.log('👁️ Window focused, checking for new comments...');
      fetchComments(true);
    };

    // Method 3: Periodic URL checking
    const urlCheckInterval = setInterval(checkUrlChange, 1000);
    window.addEventListener('focus', handleWindowFocus);

    // Method 4: Start polling immediately (fallback)
    setTimeout(() => {
      console.log('🔄 Starting fallback polling...');
      startCommentPolling();
    }, 10000); // Start after 10 seconds

    // Cleanup
    return () => {
      clearInterval(urlCheckInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  };

  // Manual refresh function
  const handleRefresh = async () => {
    await fetchComments();
    // Comments refreshed - no toast needed
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



  // Initial load
  useEffect(() => {
    if (cleanPostId && cleanPostId !== 'demo-manga') {
      fetchComments();
    } else {
      setIsLoading(false);
      setCommentsData({ totalItems: 0, items: [] });
    }
  }, [postId, cleanPostId]);

  // Apply dark mode when color mode changes
  useEffect(() => {
    if (iframeRef.current) {
      setTimeout(() => applyIframeDarkMode(), 100);
    }
  }, [colorMode]);

  // Get paginated comments
  const paginatedComments = commentsData?.items?.slice(0, currentPage * COMMENTS_PER_PAGE) || [];
  const hasMoreComments = commentsData?.items?.length > currentPage * COMMENTS_PER_PAGE;

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
            ({commentsData?.totalItems || 0})
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
      <Box
        borderRadius="8px"
        overflow="hidden"
        data-testid="comment-form"
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

      {/* Comments List */}
      <VStack spacing={4} align="stretch">
        {isLoading ? (
          <HStack justify="center" py={8}>
            <Spinner size="md" color={accentColor} />
            <Text fontSize="sm" color={mutedColor}>Loading comments...</Text>
          </HStack>
        ) : commentsData?.totalItems === 0 ? (
          <VStack spacing={3} py={8}>
            <FaComments size={24} color={mutedColor} />
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              No comments yet. Be the first to share your thoughts!
            </Text>
          </VStack>
        ) : (
          <>
            {paginatedComments.map((comment: any, index: number) => (
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

            {hasMoreComments && (
              <HStack spacing={2} justify="center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  color={mutedColor}
                  _hover={{ color: textColor }}
                >
                  Load more ({commentsData.totalItems - paginatedComments.length} remaining)
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.ceil(commentsData.totalItems / COMMENTS_PER_PAGE))}
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
