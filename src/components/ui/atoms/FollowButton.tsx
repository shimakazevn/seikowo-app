import React from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { useFollow } from '../hooks/useFollow';

// Local Post interface to match PostPage
interface PostData {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  labels?: string[];
  data?: PostData;
}

interface FollowButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  post: PostData;
  onFollowChange?: (isFollowed: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  post,
  onFollowChange,
  ...buttonProps
}) => {
  const { isFollowing, toggleFollow, isLoading } = useFollow();
  const isFollowed = isFollowing(post.id);

  const handleClick = async () => {
    const result = await toggleFollow(post);
    if (result !== false && onFollowChange) {
      onFollowChange(result);
    }
  };

  return (
    <Button
      leftIcon={<StarIcon />}
      colorScheme={isFollowed ? "yellow" : "gray"}
      onClick={handleClick}
      isLoading={isLoading}
      loadingText={isFollowed ? "Đang bỏ follow..." : "Đang follow..."}
      {...buttonProps}
    >
      {isFollowed ? "Đã theo dõi" : "Theo dõi"}
    </Button>
  );
};

export default FollowButton;
