import React, { useRef, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Icon,
  Button,
  Heading,
  useColorModeValue,
  useBreakpointValue,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { FiChevronRight, FiArrowLeft } from 'react-icons/fi';

export interface TabItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  color: string;
  component: React.ComponentType<any>;
}

export interface TabLayoutProps {
  title: string;
  description: string;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onBackToList?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const TabLayout: React.FC<TabLayoutProps> = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  onBackToList,
  isLoading = false,
  children
}) => {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Color mode values
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  // Auto-select first tab on desktop
  useEffect(() => {
    if (!isMobile && (!activeTab || activeTab === '') && tabs.length > 0) {
      onTabChange(tabs[0].id);
    }
  }, [isMobile, activeTab, tabs, onTabChange]);

  // Get current tab
  const currentTab = React.useMemo(() =>
    tabs.find(tab => tab.id === activeTab) || tabs[0],
    [activeTab, tabs]
  );

  // Enhanced sticky sidebar - avoid fixed position issues
  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      const sidebar = sidebarRef.current;
      const sidebar_content = contentRef.current;

      if (!sidebar || !sidebar_content) {
        return;
      }

      const scrollTop = window.scrollY;
      const contentHeight = sidebar_content.getBoundingClientRect().height;
      const sidebarHeight = sidebar.getBoundingClientRect().height;

      // Only apply transform if content is much taller than sidebar
      if (contentHeight > sidebarHeight + 200) {
        const maxTranslate = contentHeight - sidebarHeight - 160; // Account for padding
        const translateY = Math.min(Math.max(0, scrollTop - 80), maxTranslate);

        sidebar.style.transform = `translateY(${translateY}px)`;
        sidebar.style.transition = 'transform 0.1s ease-out';
      } else {
        sidebar.style.transform = "";
        sidebar.style.transition = "";
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Mobile view - Tab List
  if (isMobile && (!activeTab || activeTab === '')) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" color={textColor} mb={2}>
              {title}
            </Heading>
            <Text color={mutedTextColor} fontSize="md">
              {description}
            </Text>
          </Box>

          {/* Tab List */}
          <VStack spacing={3} align="stretch">
            {tabs.map(tab => (
              <Card
                key={tab.id}
                variant="outline"
                cursor="pointer"
                onClick={() => onTabChange(tab.id)}
                _hover={{
                  bg: hoverBg,
                  transform: 'translateY(-2px)',
                  boxShadow: 'md'
                }}
                transition="all 0.2s ease"
              >
                <CardBody py={4}>
                  <HStack spacing={4} justify="space-between">
                    <HStack spacing={4}>
                      <Box p={2} borderRadius="lg" bg={`${tab.color}15`}>
                        <Icon as={tab.icon} color={tab.color} w={5} h={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" fontSize="md" color={textColor}>
                          {tab.label}
                        </Text>
                        <Text fontSize="sm" color={mutedTextColor}>
                          {tab.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FiChevronRight} color={mutedTextColor} w={4} h={4} />
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>
      </Container>
    );
  }

  // Mobile view - Tab Content
  if (isMobile && activeTab) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={onBackToList}
              size="sm"
            >
              {title}
            </Button>
          </HStack>

          <Box>
            <HStack spacing={3} mb={2}>
              <Icon as={currentTab.icon} color={currentTab.color} w={6} h={6} />
              <Heading size="lg" color={textColor}>
                {currentTab.label}
              </Heading>
            </HStack>
            <Text color={mutedTextColor} fontSize="md">
              {currentTab.description}
            </Text>
          </Box>

          <Box>
            {isLoading ? (
              <Center h="200px">
                <Spinner size="xl" color={textColor} />
              </Center>
            ) : (
              children
            )}
          </Box>
        </VStack>
      </Container>
    );
  }

  // Desktop view
  return (
    <Container maxW="container.xl" pb={6}>
      <Box display="flex" gap={4}>
        {/* Sidebar */}
        <Box
          ref={sidebarRef}
          width="270px"
          flexShrink={0}
          position="sticky"
          top={0}
          mt="35vh"
          height="max-content"
          alignSelf="flex-start"
        >
          <VStack align="stretch" spacing={3}>
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant="ghost"
                justifyContent="flex-start"
                leftIcon={<Icon as={tab.icon} color={activeTab === tab.id ? tab.color : mutedTextColor} w={5} h={5} />}
                color={activeTab === tab.id ? tab.color : textColor}
                bg={activeTab === tab.id ? `${tab.color}15` : 'transparent'}
                _hover={{
                  bg: activeTab === tab.id ? `${tab.color}25` : hoverBg,
                  transform: 'translateX(4px)'
                }}
                onClick={() => onTabChange(tab.id)}
                transition="all 0.2s ease"
                size="lg"
                fontWeight="medium"
                borderRadius="md"
                h="auto"
                py={3}
                px={4}
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold" fontSize="md">{tab.label}</Text>
                  <Text fontSize="sm" color={mutedTextColor}>
                    {tab.description}
                  </Text>
                </VStack>
              </Button>
            ))}
          </VStack>
        </Box>

        {/* Content */}
        <Box ref={contentRef} flex={1} py={8}>
          <Heading size="lg" mb={2} color={textColor}>
            {currentTab.label}
          </Heading>
          <Text color={mutedTextColor} fontSize="md" mb={6}>
            {currentTab.description}
          </Text>

          {isLoading ? (
            <Center h="200px">
              <Spinner size="xl" color={textColor} />
            </Center>
          ) : (
            children
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default React.memo(TabLayout); 