import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Text, 
  Badge, 
  HStack, 
  VStack,
  Button,
  useColorModeValue,
  Tooltip,
  Icon
} from '@chakra-ui/react';
import { MdWifi, MdWifiOff, MdStorage, MdRefresh } from 'react-icons/md';
import { getCachedData, clearCache, CACHE_KEYS } from '../utils/cache';

interface CacheStatusProps {
  onClearCache?: () => void;
}

const CacheStatus: React.FC<CacheStatusProps> = ({ onClearCache }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheInfo, setCacheInfo] = useState<{
    hasCache: boolean;
    cacheAge: number;
    postsCount: number;
  }>({
    hasCache: false,
    cacheAge: 0,
    postsCount: 0
  });

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    checkCacheStatus();
  }, []);

  const checkCacheStatus = async () => {
    try {
      const cachedData = await getCachedData(CACHE_KEYS.RSS_POSTS);
      if (cachedData) {
        const data = cachedData as any;
        setCacheInfo({
          hasCache: true,
          cacheAge: Date.now() - (data.timestamp || 0),
          postsCount: data.items?.length || 0
        });
      }
    } catch (error) {
      console.error('Error checking cache status:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache(CACHE_KEYS.RSS_POSTS);
      await clearCache(CACHE_KEYS.OFFLINE_POSTS);
      setCacheInfo({ hasCache: false, cacheAge: 0, postsCount: 0 });
      if (onClearCache) onClearCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const formatCacheAge = (ageMs: number): string => {
    const minutes = Math.floor(ageMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Box
      bg={bgColor}
      p={3}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      _dark={{ borderColor: 'gray.600' }}
    >
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="semibold" color={textColor}>
            Cache & Network Status
          </Text>
          <HStack spacing={2}>
            <Tooltip label={isOnline ? 'Online' : 'Offline'}>
              <Badge
                colorScheme={isOnline ? 'green' : 'red'}
                variant="subtle"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <Icon as={isOnline ? MdWifi : MdWifiOff} />
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </Tooltip>
          </HStack>
        </HStack>

        {cacheInfo.hasCache && (
          <HStack justify="space-between" fontSize="xs" color={textColor}>
            <HStack spacing={1}>
              <Icon as={MdStorage} />
              <Text>
                {cacheInfo.postsCount} posts cached
              </Text>
            </HStack>
            <Text>
              {formatCacheAge(cacheInfo.cacheAge)}
            </Text>
          </HStack>
        )}

        <HStack spacing={2}>
          <Button
            size="xs"
            variant="outline"
            leftIcon={<MdRefresh />}
            onClick={checkCacheStatus}
          >
            Check
          </Button>
          {cacheInfo.hasCache && (
            <Button
              size="xs"
              variant="outline"
              colorScheme="red"
              onClick={handleClearCache}
            >
              Clear Cache
            </Button>
          )}
        </HStack>

        {!isOnline && (
          <Text fontSize="xs" color="orange.500">
            ⚠️ You're offline. Showing cached content.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default CacheStatus;
