import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import PostsManagementPage from '../../../pages/user/PostsManagement';
import { bloggerAdminService } from '../../../services/bloggerAdminService';
import useUserStore from '../../../store/useUserStore';
import type { FavoritePost, MangaBookmark } from '../../../types/global';

interface PostsManagementProps {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
  favoritesPosts?: FavoritePost[];
  bookmarkedPosts?: MangaBookmark[];
}

const PostsManagement: React.FC<PostsManagementProps> = ({
  cardBg,
  textColor,
  mutedColor,
  accentColor,
  isDark,
}) => {
  const { user } = useUserStore();
  const [internalBloggerUserRole, setInternalBloggerUserRole] = React.useState<'ADMIN' | 'AUTHOR' | 'READER' | 'NONE' | null>(null);

  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setInternalBloggerUserRole('NONE');
        return;
      }

      try {
        const role = await bloggerAdminService.getBloggerUserRole();
        setInternalBloggerUserRole(role);
      } catch (error) {
        console.error('[PostsManagement] Error checking user role:', error);
        setInternalBloggerUserRole('NONE');
      }
    };

    checkUserRole();
  }, [user]);

  return (
    <Box>
      <PostsManagementPage
        cardBg={cardBg}
        textColor={textColor}
        mutedColor={mutedColor}
        accentColor={accentColor}
        isDark={isDark}
        bloggerUserRole={internalBloggerUserRole}
      />
    </Box>
  );
};

export default PostsManagement; 