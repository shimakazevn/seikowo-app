import { Box, Text, Button, HStack, VStack, useColorModeValue } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';

interface BackupSectionProps {
  onBackup: () => void;
  isLoading: boolean;
}

export const BackupSection = ({ onBackup, isLoading }: BackupSectionProps) => {
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const bgHoverColor = useColorModeValue("rgba(255,255,255,0.68)", "rgba(26,32,44,0.68)");
  const bgColor = useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)");

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor="gray.200"
      bg={bgColor}
      _hover={{ bg: bgHoverColor }}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Box>
            <Text fontWeight="medium" color={textColor}>
              Sao lưu dữ liệu
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              Sao lưu dữ liệu bookmark lên Google Drive
            </Text>
          </Box>
          <Button
            colorScheme="green"
            onClick={onBackup}
            isLoading={isLoading}
            loadingText="Đang backup..."
            leftIcon={<DownloadIcon />}
            variant="solid"
            size="md"
          >
            Backup
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
