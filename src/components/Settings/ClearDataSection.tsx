import { Box, Text, Button, HStack, VStack, useColorModeValue } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

interface ClearDataSectionProps {
  onClearData: () => void;
}

export const ClearDataSection = ({ onClearData }: ClearDataSectionProps) => {
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
              Xóa dữ liệu
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              Xóa toàn bộ dữ liệu bookmark trên Drive và local
            </Text>
          </Box>
          <Button
            colorScheme="red"
            onClick={onClearData}
            leftIcon={<DeleteIcon />}
            variant="solid"
            size="md"
          >
            Xóa dữ liệu
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
