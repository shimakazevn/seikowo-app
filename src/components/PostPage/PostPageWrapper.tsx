import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import PostPage from "../../pages/PostPage";
import MangaReaderPage from "../../pages/MangaReaderPage";

const PostPageWrapper: React.FC = () => {
  const location = useLocation();

  // Check if it's manga reader mode
  const searchParams = new URLSearchParams(location.search);
  const isReaderMode = searchParams.get('read') === 'true';

  if (isReaderMode) {
    // MangaReaderPage needs fullscreen - no margins
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={1000}
      >
        <MangaReaderPage />
      </Box>
    );
  }

  return <PostPage />;
};

export default PostPageWrapper;
