import React from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@chakra-ui/react';
import { FaBookmark, FaBookmark as FaBookmarkSolid } from 'react-icons/fa';
import { useBookmark, MangaData } from '../hooks/useBookmark';

interface BookmarkButtonProps extends Omit<IconButtonProps, 'onClick' | 'aria-label'> {
  mangaData: MangaData;
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ 
  mangaData, 
  onBookmarkChange,
  ...buttonProps 
}) => {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmark();
  const bookmarked = isBookmarked(mangaData.id);

  const handleClick = async () => {
    const result = await toggleBookmark(mangaData);
    if (result !== false && onBookmarkChange) {
      onBookmarkChange(result);
    }
  };

  return (
    <Tooltip label={bookmarked ? "Bỏ bookmark" : "Bookmark"}>
      <IconButton
        aria-label={bookmarked ? "Bỏ bookmark" : "Bookmark"}
        icon={bookmarked ? <FaBookmarkSolid /> : <FaBookmark />}
        onClick={handleClick}
        isLoading={isLoading}
        colorScheme={bookmarked ? 'blue' : undefined}
        variant="ghost"
        size="sm"
        {...buttonProps}
      />
    </Tooltip>
  );
};

export default BookmarkButton;
