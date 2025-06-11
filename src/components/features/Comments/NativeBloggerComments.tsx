import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  useColorMode,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FaComments, FaSync, FaReply } from 'react-icons/fa';
import { blogConfig } from '../../../config';
// Using direct ATOM feed parsing instead of JSONP

interface NativeBloggerCommentsProps {
  postId: string;
  blogId?: string;
}

// Recursive Comment Thread Component
interface CommentThreadProps {
  comment: any;
  level: number;
  isLast: boolean;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  accentColor: string;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  level,
  isLast,
  onReply,
  replyingTo,
  isDark,
  textColor,
  mutedColor,
  accentColor
}) => {
  const maxLevel = 2; // Giảm từ 3 xuống 2 để tránh bị đẩy ra ngoài mobile
  const currentLevel = Math.min(level, maxLevel);
  const indentSize = currentLevel * 16; // Giảm từ 20px xuống 16px cho mobile

  return (
    <Box>
      {/* Main Comment */}
      <Box
        data-comment-id={comment.id}
        data-testid={`comment-${comment.id}`}
        py={3}
        pl={indentSize}
        borderBottom={isLast && (!comment.replies || comment.replies.length === 0) ? "none" : "1px solid"}
        borderColor={isDark ? "#333" : "#e2e8f0"}
        bg={level > 0 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent'}
        position="relative"
      >
        {/* Clean reply indicator - chỉ dùng subtle background */}
        {level > 0 && (
          <Box
            position="absolute"
            left={2}
            top={0}
            bottom={0}
            width="2px"
            bg={isDark ? "rgba(0,212,255,0.3)" : "rgba(49,130,206,0.3)"}
            borderRadius="1px"
          />
        )}

        {/* Compact parent reference cho replies */}
        {comment.isReply && comment.parentComment && (
          <Box mb={2} fontSize="xs">
            <Text color={mutedColor} fontStyle="italic">
              ↳ replying to {comment.parentComment.author?.displayName}
            </Text>
          </Box>
        )}

        <HStack spacing={level > 0 ? 2 : 3} align="start">
          <Box
            w={level > 0 ? 5 : 7} // Nhỏ hơn cho mobile
            h={level > 0 ? 5 : 7}
            borderRadius="full"
            overflow="hidden"
            flexShrink={0}
            bg={accentColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <img
              src={comment.author?.image?.url}
              alt={comment.author?.displayName || 'User'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={(e) => {
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
                      font-size: ${level > 0 ? '8px' : '10px'};
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

          <VStack align="start" spacing={1} flex={1} minW={0}> {/* minW={0} để tránh overflow */}
            <HStack spacing={2} justify="space-between" w="100%" flexWrap="wrap">
              <HStack spacing={2} minW={0} flex={1}>
                <Text
                  fontSize={level > 0 ? "xs" : "sm"}
                  fontWeight="medium"
                  color={textColor}
                  isTruncated
                >
                  {comment.author?.displayName || 'Anonymous'}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {comment.published ? new Date(comment.published).toLocaleDateString() : ''}
                </Text>
                {level > 0 && (
                  <Text fontSize="xs" color={accentColor} fontWeight="medium">
                    reply
                  </Text>
                )}
              </HStack>

              <Button
                size="xs"
                variant="ghost"
                onClick={() => onReply(comment.id)}
                color={replyingTo === comment.id ? accentColor : mutedColor}
                _hover={{ color: accentColor }}
                leftIcon={<FaReply size={8} />}
                bg={replyingTo === comment.id ? (isDark ? 'rgba(0,212,255,0.1)' : 'rgba(49,130,206,0.1)') : 'transparent'}
                px={2} // Compact padding
              >
                {replyingTo === comment.id ? 'cancel' : 'reply'}
              </Button>
            </HStack>

            <Text
              fontSize={level > 0 ? "xs" : "sm"}
              color={textColor}
              lineHeight="1.4"
              wordBreak="break-word" // Tránh text overflow trên mobile
              dangerouslySetInnerHTML={{ __html: comment.content || 'No content' }}
            />
          </VStack>
        </HStack>
      </Box>

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <VStack spacing={0} align="stretch">
          {comment.replies.map((reply: any, replyIndex: number) => (
            <CommentThread
              key={reply.id || `${comment.id}-reply-${replyIndex}`}
              comment={reply}
              level={level + 1}
              isLast={replyIndex === comment.replies.length - 1 && isLast}
              onReply={onReply}
              replyingTo={replyingTo}
              isDark={isDark}
              textColor={textColor}
              mutedColor={mutedColor}
              accentColor={accentColor}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

const NativeBloggerComments: React.FC<NativeBloggerCommentsProps> = ({
  postId,
  blogId = blogConfig.blogId
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { colorMode } = useColorMode();
  const toast = useToast();

  const isDark = colorMode === 'dark';
  const textColor = isDark ? '#ffffff' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const accentColor = isDark ? '#00d4ff' : '#3182ce';

  // Clean post ID
  const cleanPostId = postId?.includes('.post-')
    ? postId.split('.post-')[1]
    : postId?.includes('/')
    ? postId.split('/').pop() || postId
    : postId;

  // Load comments using same method as BloggerCommentSection (working)
  const loadComments = async () => {
    if (!cleanPostId) {
      console.log('❌ No cleanPostId provided');
      return;
    }

    console.log('🔄 Loading comments for post:', cleanPostId);
    setIsLoading(true);

    try {
      // Use the specific URL format that should only return comments for this post
      const feedUrls = [
        `https://seikowo-app.blogspot.com/feeds/${cleanPostId}/comments/default?max-results=500`,
        `https://seikowo-app.blogspot.com/feeds/comments/default?postId=${cleanPostId}&max-results=500`,
      ];

      for (const feedUrl of feedUrls) {
        console.log('🔄 Trying comment feed:', feedUrl);

        try {
          // Environment-based strategy
          let response;
          let usedProxy = false;
          const isDevelopment = import.meta.env.DEV;

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

            // Handle XML response
            console.log('📄 Parsing XML response...');
            const xmlContent = await response.text();
            console.log('📄 XML content length:', xmlContent.length);

            let commentsData;
            if (xmlContent && xmlContent.trim()) {
              commentsData = parseCommentsFromAtom(xmlContent);
              console.log('🔍 XML parsed comments:', commentsData);
            } else {
              console.warn('⚠️ Empty XML content received');
              continue;
            }

            if (commentsData && commentsData.items) {

              // Debug: Log all comments first
              console.log(`📊 Total comments received: ${commentsData.items.length}`);
              console.log(`🎯 Looking for comments for post: ${cleanPostId}`);

              let filteredItems = commentsData.items;

              // Try different filtering strategies
              if (commentsData.items.length > 0 && cleanPostId) {
                // Strategy 1: Strict filtering
                const strictFiltered = commentsData.items.filter((comment: any) => {
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

              // Organize comments into threaded structure
              const threadedComments = organizeCommentsIntoThreads(filteredItems);

              setComments(threadedComments);
              setHasMore(false);
              setIsLoading(false);

              // Comments loaded successfully - no toast needed
              return;
            }
          }
        } catch (error) {
          console.warn('❌ Feed fetch failed:', feedUrl, error);
          continue;
        }
      }

      // No comments found
      console.log('📭 No comments found');
      setComments([]);
      setHasMore(false);
      setIsLoading(false);

    } catch (error) {
      console.error('❌ Failed to load comments:', error);
      setComments([]);
      setIsLoading(false);
      toast({
        title: 'Failed to load comments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Organize comments into threaded structure
  const organizeCommentsIntoThreads = (comments: any[]) => {
    const commentMap = new Map();
    const rootComments: any[] = [];
    let hasReplies = false;

    // First pass: Create map of all comments and check for replies
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
      if (comment.parentId) {
        hasReplies = true;
      }
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

    // If no threading detected or all replies are orphaned, return all comments as root comments
    const totalRepliesLinked = rootComments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0);

    if (!hasReplies || totalRepliesLinked === 0) {
      return comments.map(comment => ({ ...comment, replies: [], isReply: false }));
    }

    return rootComments;
  };



  // Parse comments from ATOM feed (same as BloggerCommentSection)
  const parseCommentsFromAtom = (xmlContent: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const entries = xmlDoc.querySelectorAll('entry');

      const comments = Array.from(entries).map((entry) => {
        const id = entry.querySelector('id')?.textContent || '';

        // Better content extraction
        let content = entry.querySelector('content')?.textContent ||
                     entry.querySelector('summary')?.textContent || '';

        // Clean up content (remove extra whitespace, decode HTML entities)
        if (content) {
          content = content.trim();
          // Decode common HTML entities
          content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        }

        const published = entry.querySelector('published')?.textContent || '';
        const updated = entry.querySelector('updated')?.textContent || '';

        // Extract author info
        const authorElement = entry.querySelector('author');
        const authorName = authorElement?.querySelector('name')?.textContent || 'Anonymous';
        const authorUri = authorElement?.querySelector('uri')?.textContent || '';

        // Better avatar extraction
        let avatarUrl = 'https://www.blogger.com/img/blogger_logo_round_35.png';

        // Method 1: gd:image
        const gdImage = authorElement?.querySelector('gd\\:image, image');
        if (gdImage) {
          const src = gdImage.getAttribute('src');
          if (src && !src.includes('blogger_logo')) {
            avatarUrl = src;
          }
        }

        // Method 2: Extract from content if it has profile images
        if (avatarUrl.includes('blogger_logo') && content.includes('googleusercontent')) {
          const imgMatch = content.match(/https:\/\/[^"'\s]*googleusercontent[^"'\s]*/);
          if (imgMatch) {
            avatarUrl = imgMatch[0];
          }
        }

        // Better parent comment ID extraction for threading
        let parentId = null;

        // Method 1: Check thr:in-reply-to
        const inReplyTo = entry.querySelector('thr\\:in-reply-to');
        if (inReplyTo) {
          const ref = inReplyTo.getAttribute('ref');
          if (ref) {
            parentId = ref.split('.post-')[1] || ref;
          }
        }

        // Method 2: Check links for reply relationships
        if (!parentId) {
          const links = entry.querySelectorAll('link');
          for (const link of links) {
            const href = link.getAttribute('href') || '';
            const rel = link.getAttribute('rel') || '';
            if (rel === 'related' && href.includes('comments/default/')) {
              const parentMatch = href.match(/comments\/default\/([^\/]+)/);
              if (parentMatch) {
                parentId = parentMatch[1];
                break;
              }
            }
          }
        }

        console.log(`📝 XML Comment:`, {
          id: id.split('.post-')[1] || id,
          author: authorName,
          content: content.substring(0, 100) + '...',
          parentId,
          avatarUrl: avatarUrl.includes('blogger_logo') ? 'default' : 'custom'
        });

        return {
          id: id.split('.post-')[1] || id,
          content: content || 'No content available',
          published,
          updated,
          parentId, // Add parent ID for threading
          author: {
            displayName: authorName,
            url: authorUri,
            image: {
              url: avatarUrl
            }
          }
        };
      });

      return {
        totalItems: comments.length,
        items: comments
      };
    } catch (error) {
      console.warn('❌ Error parsing comment ATOM feed:', error);
      return { totalItems: 0, items: [] };
    }
  };

  // Initialize comment loading (simple useEffect)
  useEffect(() => {
    if (!cleanPostId) {
      console.log('❌ No cleanPostId, skipping initialization');
      return;
    }

    console.log('🔄 useEffect triggered - Loading comments for post:', cleanPostId);
    loadComments();
  }, [cleanPostId, blogId]); // Only depend on props

  // Load more comments (simplified)
  const loadMoreComments = () => {
    if (hasMore) {
      loadComments();
    }
  };

  // Refresh comments
  const refreshComments = () => {
    console.log('🔄 Refreshing comments...');
    setComments([]);
    loadComments();
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

  // Scroll to comment form
  const scrollToCommentForm = () => {
    console.log('🎯 Scrolling to comment form...');

    // Find the comment form container
    const commentFormContainer = document.querySelector('[data-testid="comment-form"]');
    if (commentFormContainer) {
      commentFormContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    } else {
      // Fallback: scroll to bottom of page where comment form usually is
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handle reply to comment - Show inline reply form and scroll to it
  const handleReply = (commentId: string) => {
    if (replyingTo === commentId) {
      // Cancel reply
      setReplyingTo(null);
    } else {
      // Start reply
      setReplyingTo(commentId);

      // Scroll to comment form after state update
      setTimeout(() => {
        scrollToCommentForm();
      }, 100);
    }
  };

  if (!cleanPostId) {
    return (
      <Box p={6}>
        <Text fontSize="sm" color={mutedColor}>
          Comments unavailable - Invalid post ID
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <FaComments size={16} color={accentColor} />
          <Text fontSize="sm" color={mutedColor}>
            ({comments.length})
          </Text>
        </HStack>
        
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshComments}
            isLoading={isLoading}
            color={mutedColor}
            _hover={{ color: accentColor }}
            leftIcon={<FaSync />}
          >
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={scrollToCommentForm}
            color={mutedColor}
            _hover={{ color: accentColor }}
          >
            Add Comment
          </Button>
        </HStack>
      </HStack>

      {/* Comments List */}
      <VStack spacing={4} align="stretch">
        {isLoading && comments.length === 0 ? (
          <HStack justify="center" py={8}>
            <Spinner size="md" color={accentColor} />
            <Text fontSize="sm" color={mutedColor}>Loading comments...</Text>
          </HStack>
        ) : comments.length === 0 ? (
          <VStack spacing={3} py={8}>
            <FaComments size={24} color={mutedColor} />
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              No comments yet. Be the first to share your thoughts!
            </Text>
            <Text fontSize="xs" color={mutedColor} textAlign="center">
              Post ID: {cleanPostId} | Blog ID: {blogId}
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                console.log('🔍 Debug info:');
                console.log('- cleanPostId:', cleanPostId);
                console.log('- blogId:', blogId);
                console.log('- comments:', comments);
                console.log('- isLoading:', isLoading);
                console.log('- hasMore:', hasMore);
                console.log('- Feed URL would be:', `https://seikowo-app.blogspot.com/feeds/comments/default?postId=${cleanPostId}&max-results=500`);
              }}
              color={mutedColor}
            >
              Debug Info
            </Button>
          </VStack>
        ) : (
          <>
            {comments.map((comment, index) => (
              <CommentThread
                key={comment.id || index}
                comment={comment}
                level={0}
                isLast={index === comments.length - 1}
                onReply={handleReply}
                replyingTo={replyingTo}
                isDark={isDark}
                textColor={textColor}
                mutedColor={mutedColor}
                accentColor={accentColor}
              />
            ))}
            
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreComments}
                isLoading={isLoading}
                color={mutedColor}
                _hover={{ color: textColor }}
              >
                Load more comments
              </Button>
            )}
          </>
        )}
      </VStack>

      {/* Inline Comment Form */}
      <Box mt={6} data-testid="comment-form">
        <Text fontSize="md" fontWeight="medium" color={textColor} mb={4}>
          {replyingTo ? `Replying to comment ${replyingTo}` : 'Add a comment'}
        </Text>

        <Box
          borderRadius="8px"
          overflow="hidden"
          border="1px solid"
          borderColor={replyingTo ? accentColor : (isDark ? "#333" : "#e2e8f0")}
          bg={replyingTo ? (isDark ? '#1a4d4d' : '#e6fffa') : 'transparent'}
        >
          <iframe
            src={`https://www.blogger.com/comment-iframe.g?blogID=${blogId}&postID=${cleanPostId}${replyingTo ? `&parentID=${replyingTo}` : ''}`}
            width="100%"
            height="200"
            title={replyingTo ? `Reply to comment ${replyingTo}` : "Add Comment"}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            style={{
              border: 'none',
              display: 'block'
            }}
            onLoad={() => {
              console.log('📝 Comment form loaded', replyingTo ? `(replying to ${replyingTo})` : '(new comment)');

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
                      await loadComments(); // Refresh comments

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

              // Check current URL immediately
              checkCurrentUrlForComment();
            }}
          />
        </Box>

        {replyingTo && (
          <HStack mt={2} justify="space-between">
            <Text fontSize="xs" color={mutedColor}>
              Reply mode: Your comment will be posted as a reply
            </Text>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
              color={mutedColor}
            >
              Cancel Reply
            </Button>
          </HStack>
        )}
      </Box>
    </VStack>
  );
};

export default NativeBloggerComments;
