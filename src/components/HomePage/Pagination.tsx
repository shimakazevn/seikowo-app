import React from 'react';
import {
  Flex,
  Box,
  HStack,
  IconButton,
  Button,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  mutedTextColor?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  mutedTextColor
}) => {
  const paginationBg = useColorModeValue('white', 'gray.800');
  const paginationHoverBg = useColorModeValue('gray.100', 'gray.700');

  if (totalPages <= 1) return null;

  return (
    <Flex
      justify={{ base: "center", md: "flex-end" }}
      w={{ base: "100%", md: "auto" }}
      px={{ base: 2, md: 0 }}
      mb={4}
    >
      <Box
        overflowX="auto"
        py={2}
        px={4}
        borderRadius="lg"
        maxW="100%"
      >
        <HStack spacing={{ base: 1, md: 2 }}>
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={() => onPageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
            aria-label="Previous page"
            size={{ base: 'sm', md: 'md' }}
            variant="ghost"
            _hover={{
              bg: paginationHoverBg
            }}
          />
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNum = i + 1;
            const isCurrent = currentPage === pageNum;

            if (totalPages > 7) {
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={pageNum}
                    size={{ base: 'sm', md: 'md' }}
                    variant={isCurrent ? "solid" : "ghost"}
                    colorScheme={isCurrent ? "blue" : "gray"}
                    onClick={() => onPageChange(pageNum)}
                    minW={{ base: '32px', md: '40px' }}
                    px={{ base: 2, md: 3 }}
                  >
                    {pageNum}
                  </Button>
                );
              } else if (
                pageNum === currentPage - 2 ||
                pageNum === currentPage + 2
              ) {
                return (
                  <Text
                    key={pageNum}
                    color={mutedTextColor}
                    px={2}
                  >
                    ...
                  </Text>
                );
              }
              return null;
            }

            return (
              <Button
                key={pageNum}
                size={{ base: 'sm', md: 'md' }}
                variant={isCurrent ? "solid" : "ghost"}
                colorScheme={isCurrent ? "blue" : "gray"}
                onClick={() => onPageChange(pageNum)}
                minW={{ base: '32px', md: '40px' }}
                px={{ base: 2, md: 3 }}
              >
                {pageNum}
              </Button>
            );
          })}
          <IconButton
            icon={<ChevronRightIcon />}
            onClick={() => onPageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages}
            aria-label="Next page"
            size={{ base: 'sm', md: 'md' }}
            variant="ghost"
            _hover={{
              bg: paginationHoverBg
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
};

export default Pagination;