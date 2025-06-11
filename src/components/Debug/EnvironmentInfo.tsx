import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
  useColorMode,
  Divider,
  Heading
} from '@chakra-ui/react';
import { getEnvironmentInfo } from '../../utils/apiUtils';

const EnvironmentInfo: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const envInfo = getEnvironmentInfo();
  
  // Theme colors
  const bgColor = isDark ? '#111111' : '#f8f9fa';
  const borderColor = isDark ? '#333333' : '#e5e5e5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedTextColor = isDark ? '#888888' : '#666666';

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <Heading size="sm" color={textColor}>
          Environment Information
        </Heading>
        
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" color={mutedTextColor}>
              Mode:
            </Text>
            <Badge 
              colorScheme={envInfo.isDev ? 'orange' : 'green'}
              variant="solid"
            >
              {envInfo.mode}
            </Badge>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontSize="sm" color={mutedTextColor}>
              Environment:
            </Text>
            <Badge 
              colorScheme={envInfo.isDev ? 'blue' : 'purple'}
              variant="outline"
            >
              {envInfo.isDev ? 'Development' : 'Production'}
            </Badge>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontSize="sm" color={mutedTextColor}>
              Base URL:
            </Text>
            <Code fontSize="xs" colorScheme="gray">
              {envInfo.baseUrl}
            </Code>
          </HStack>
          
          <Divider borderColor={borderColor} />
          
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              API Strategy:
            </Text>
            <Text fontSize="xs" color={mutedTextColor}>
              {envInfo.isDev 
                ? '🔧 Using Vite proxy to bypass CORS restrictions'
                : '🚀 Direct API calls to Blogger endpoints'
              }
            </Text>
            <Code fontSize="xs" colorScheme={envInfo.isDev ? 'orange' : 'green'}>
              {envInfo.isDev 
                ? '/api/blogger-json?url=...'
                : envInfo.baseUrl+'/...'
              }
            </Code>
          </VStack>
          
          <Divider borderColor={borderColor} />
          
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              Available Proxies:
            </Text>
            {envInfo.isDev ? (
              <VStack spacing={1} align="stretch">
                <Code fontSize="xs" colorScheme="blue">
                  /api/atom-proxy - ATOM feeds
                </Code>
                <Code fontSize="xs" colorScheme="blue">
                  /api/blogger-json - JSON API
                </Code>
                <Code fontSize="xs" colorScheme="blue">
                  /api/blogger-upload - Image uploads
                </Code>
              </VStack>
            ) : (
              <Text fontSize="xs" color={mutedTextColor}>
                No proxies available in production
              </Text>
            )}
          </VStack>
        </VStack>
      </VStack>
    </Box>
  );
};

export default EnvironmentInfo;
